"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { Textarea } from "@workspace/ui/components/textarea"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { signOut, useSession } from "@/lib/auth-client"

type ProfileResponse = {
  user?: {
    id: string
    name: string
    email: string
  }
  profile?: {
    location?: string | null
    skills?: string | null
    experienceLevel?: "INTERN" | "JUNIOR" | "MID" | "SENIOR" | null
    resumeUrl?: string | null
  } | null
  metrics?: {
    savedJobs: number
    applications: number
  }
  error?: string
}

type AnalyticsResponse = {
  totalApplications: number
  saved: number
  applied: number
  interview: number
  offer: number
  rejected: number
  interviewRate: number
  offerRate: number
}

type ResumeParseResponse = {
  summary: string
  location: string | null
  skills: string[]
  experienceLevel: "INTERN" | "JUNIOR" | "MID" | "SENIOR" | null
}

type RecommendationsResponse = {
  recommendations: Array<{
    applicationId: string
    jobId: string
    title: string
    company: string
    status: string
    score: number
    missingSkills: string[]
    strengths: string[]
  }>
  topMissingSkills: Array<{
    skill: string
    count: number
  }>
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export function DashboardClient() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [recommendations, setRecommendations] =
    useState<RecommendationsResponse | null>(null)
  const [resumeText, setResumeText] = useState("")
  const [parsedResume, setParsedResume] = useState<ResumeParseResponse | null>(
    null
  )
  const [isParsingResume, setIsParsingResume] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login")
    }
  }, [isPending, router, session])

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.email) return

      const [profileRes, analyticsRes, recommendationsRes] = await Promise.all([
        fetch(
          `${API_URL}/users/profile?email=${encodeURIComponent(session.user.email)}`,
          { cache: "no-store" }
        ),
        fetch(
          `${API_URL}/applications/analytics?email=${encodeURIComponent(session.user.email)}`,
          { cache: "no-store" }
        ),
        fetch(
          `${API_URL}/ai/recommendations?email=${encodeURIComponent(session.user.email)}`,
          { cache: "no-store" }
        ),
      ])

      const profileData = (await profileRes.json()) as ProfileResponse
      const analyticsData = (await analyticsRes.json()) as AnalyticsResponse
      const recommendationsData =
        (await recommendationsRes.json()) as RecommendationsResponse
      setProfile(profileData)
      setAnalytics(analyticsData)
      setRecommendations(recommendationsData)
    }

    void loadProfile()
  }, [session?.user?.email])

  const isProfileComplete = useMemo(() => {
    if (!profile?.profile) return false

    return Boolean(
      profile.profile.location &&
        profile.profile.skills &&
        profile.profile.experienceLevel
    )
  }, [profile])

  const profileFormKey = useMemo(() => {
    return JSON.stringify({
      name: profile?.user?.name ?? session?.user?.name ?? "",
      location: profile?.profile?.location ?? "",
      skills: profile?.profile?.skills ?? "",
      experienceLevel: profile?.profile?.experienceLevel ?? "",
      resumeUrl: profile?.profile?.resumeUrl ?? "",
    })
  }, [profile, session?.user?.name])

  async function refreshProfile(email: string) {
    const [profileRes, analyticsRes, recommendationsRes] = await Promise.all([
      fetch(`${API_URL}/users/profile?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
      }),
      fetch(
        `${API_URL}/applications/analytics?email=${encodeURIComponent(email)}`,
        { cache: "no-store" }
      ),
      fetch(
        `${API_URL}/ai/recommendations?email=${encodeURIComponent(email)}`,
        {
          cache: "no-store",
        }
      ),
    ])

    const profileData = (await profileRes.json()) as ProfileResponse
    const analyticsData = (await analyticsRes.json()) as AnalyticsResponse
    const recommendationsData =
      (await recommendationsRes.json()) as RecommendationsResponse
    setProfile(profileData)
    setAnalytics(analyticsData)
    setRecommendations(recommendationsData)
  }

  async function handleProfileSubmit(formData: FormData) {
    if (!session?.user?.email) return

    setError(null)
    setIsSaving(true)

    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
          name: String(formData.get("name") ?? "").trim(),
          location: String(formData.get("location") ?? "").trim(),
          skills: String(formData.get("skills") ?? "").trim(),
          experienceLevel:
            String(formData.get("experienceLevel") ?? "").trim() || null,
          resumeUrl: String(formData.get("resumeUrl") ?? "").trim(),
        }),
      })

      if (!res.ok) {
        throw new Error("Unable to save profile")
      }

      await refreshProfile(session.user.email)
      toast("Profile saved", {
        description:
          "Your onboarding details are ready for job matching and tracking.",
      })
    } catch {
      setError("Could not save your profile right now.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleParseResume() {
    if (!resumeText.trim()) {
      toast("Paste resume text first", {
        description: "Add resume content to extract skills and experience.",
      })
      return
    }

    setIsParsingResume(true)

    try {
      const res = await fetch(`${API_URL}/ai/parse-resume`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ resumeText }),
      })

      if (!res.ok) {
        throw new Error("Could not parse resume")
      }

      const data = (await res.json()) as ResumeParseResponse
      setParsedResume(data)
      toast("Resume parsed", {
        description: "Review the extracted profile details before applying.",
      })
    } catch {
      toast("Could not parse resume", {
        description: "Please try again with more resume detail.",
      })
    } finally {
      setIsParsingResume(false)
    }
  }

  async function handleApplyParsedResume() {
    if (!session?.user?.email || !parsedResume) return

    setIsSaving(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
          name: profile?.user?.name ?? session.user.name ?? "",
          location: parsedResume.location ?? profile?.profile?.location ?? "",
          skills:
            parsedResume.skills.join(", ") || profile?.profile?.skills || "",
          experienceLevel:
            parsedResume.experienceLevel ??
            profile?.profile?.experienceLevel ??
            null,
          resumeUrl: profile?.profile?.resumeUrl ?? "",
        }),
      })

      if (!res.ok) {
        throw new Error("Could not apply parsed resume")
      }

      await refreshProfile(session.user.email)
      toast("Resume insights applied", {
        description: "Your profile was updated from the parsed resume text.",
      })
    } catch {
      setError("Could not apply parsed resume right now.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    router.replace("/")
    router.refresh()
  }

  if (isPending || !session?.user) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-6 py-10">
        <p className="text-sm text-muted-foreground">
          Loading your workspace...
        </p>
      </div>
    )
  }

  return (
    <main className="min-h-svh bg-background">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              Dashboard
            </p>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-medium tracking-tight">
                Welcome back, {session.user.name ?? "there"}.
              </h1>
              <p className="text-sm text-muted-foreground">
                Build your profile first, then move into job discovery and
                application tracking.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/jobs">Browse jobs</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tracker">Open tracker</Link>
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              Sign out
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardHeader>
              <CardDescription>Saved jobs</CardDescription>
              <CardTitle className="text-2xl">
                {profile?.metrics?.savedJobs ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Total applications</CardDescription>
              <CardTitle className="text-2xl">
                {analytics?.totalApplications ??
                  profile?.metrics?.applications ??
                  0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Interview rate</CardDescription>
              <CardTitle className="text-2xl">
                {analytics?.interviewRate ?? 0}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Offer rate</CardDescription>
              <CardTitle className="text-2xl">
                {analytics?.offerRate ?? 0}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Profile status</CardDescription>
              <CardTitle className="text-2xl">
                {isProfileComplete ? "Ready" : "Incomplete"}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Profile onboarding</CardTitle>
              <CardDescription>
                This powers future job matching, resume insights, and smarter
                application recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                action={handleProfileSubmit}
                className="flex flex-col gap-6"
                key={profileFormKey}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="name">Full name</FieldLabel>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={
                        profile?.user?.name ?? session.user.name ?? ""
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="location">Location</FieldLabel>
                    <Input
                      id="location"
                      name="location"
                      placeholder="Manila, Philippines"
                      defaultValue={profile?.profile?.location ?? ""}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="skills">Skills</FieldLabel>
                    <Input
                      id="skills"
                      name="skills"
                      placeholder="React, TypeScript, NestJS"
                      defaultValue={profile?.profile?.skills ?? ""}
                    />
                    <FieldDescription>
                      Separate skills with commas for now.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="experienceLevel">
                      Experience level
                    </FieldLabel>
                    <Input
                      id="experienceLevel"
                      name="experienceLevel"
                      placeholder="JUNIOR"
                      defaultValue={profile?.profile?.experienceLevel ?? ""}
                    />
                    <FieldDescription>
                      Use INTERN, JUNIOR, MID, or SENIOR.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="resumeUrl">Resume URL</FieldLabel>
                    <Input
                      id="resumeUrl"
                      name="resumeUrl"
                      placeholder="https://example.com/resume.pdf"
                      defaultValue={profile?.profile?.resumeUrl ?? ""}
                    />
                  </Field>
                </FieldGroup>

                {error ? <FieldError>{error}</FieldError> : null}

                <Button disabled={isSaving} type="submit">
                  {isSaving ? "Saving profile..." : "Save profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resume parsing</CardTitle>
                <CardDescription>
                  Paste resume text to extract skills, experience level, and
                  location into your profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="resumeText">Resume text</FieldLabel>
                    <Textarea
                      id="resumeText"
                      placeholder="Paste your resume text here..."
                      value={resumeText}
                      onChange={(event) => setResumeText(event.target.value)}
                    />
                  </Field>
                </FieldGroup>
                <Button
                  disabled={isParsingResume}
                  onClick={() => void handleParseResume()}
                  type="button"
                >
                  {isParsingResume ? "Parsing resume..." : "Parse resume"}
                </Button>

                {parsedResume ? (
                  <div className="rounded-lg border bg-background p-4">
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-sm font-medium">Detected location</p>
                        <p className="text-sm text-muted-foreground">
                          {parsedResume.location ?? "No location detected yet"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Detected experience level
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {parsedResume.experienceLevel ??
                            "No experience level detected yet"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Detected skills</p>
                        <p className="text-sm text-muted-foreground">
                          {parsedResume.skills.length > 0
                            ? parsedResume.skills.join(", ")
                            : "No known skills detected yet"}
                        </p>
                      </div>
                      <Button
                        disabled={isSaving}
                        onClick={() => void handleApplyParsedResume()}
                        type="button"
                        variant="outline"
                      >
                        Apply to profile
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics funnel</CardTitle>
                <CardDescription>
                  A lightweight MVP view of your job search pipeline from saved
                  to offer.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="rounded-lg border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Saved</p>
                    <p className="text-sm font-medium">
                      {analytics?.saved ?? 0}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Roles you bookmarked for follow-up.
                  </p>
                </div>
                <div className="rounded-lg border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Applied</p>
                    <p className="text-sm font-medium">
                      {analytics?.applied ?? 0}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Roles you actively submitted.
                  </p>
                </div>
                <div className="rounded-lg border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Interview</p>
                    <p className="text-sm font-medium">
                      {analytics?.interview ?? 0}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Roles that progressed into interviews.
                  </p>
                </div>
                <div className="rounded-lg border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Offer</p>
                    <p className="text-sm font-medium">
                      {analytics?.offer ?? 0}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The strongest conversion stage in the funnel.
                  </p>
                </div>
                <div className="rounded-lg border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Rejected</p>
                    <p className="text-sm font-medium">
                      {analytics?.rejected ?? 0}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Closed loops that can inform future applications.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended roles</CardTitle>
                <CardDescription>
                  Best-fit saved or tracked roles based on your current profile
                  and resume-derived skills.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {recommendations?.recommendations.length ? (
                  recommendations.recommendations.map((item) => (
                    <div
                      key={item.applicationId}
                      className="rounded-lg border bg-background p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.company} · {item.status}
                          </p>
                        </div>
                        <p className="text-sm font-medium">{item.score}%</p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.strengths[0] ??
                          "Complete your profile to improve recommendations."}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Save a few roles first to unlock recommendations.
                  </p>
                )}
                <Separator />
                <div className="flex flex-col gap-3">
                  <Button asChild>
                    <Link href="/jobs">Find roles</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/tracker">View tracker</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top missing skills</CardTitle>
                <CardDescription>
                  The most common skill gaps across your current saved and
                  tracked roles.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {recommendations?.topMissingSkills.length ? (
                  recommendations.topMissingSkills.map((item) => (
                    <div
                      key={item.skill}
                      className="flex items-center justify-between rounded-lg border bg-background p-4"
                    >
                      <p className="text-sm font-medium">{item.skill}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.count} role{item.count === 1 ? "" : "s"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No repeated skill gaps detected yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
