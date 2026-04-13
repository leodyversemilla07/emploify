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
import { Textarea } from "@workspace/ui/components/textarea"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { SidebarLayout } from "@/components/sidebar-layout"
import { useSession } from "@/lib/auth-client"

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
}

type ResumeParseResponse = {
  summary: string
  location: string | null
  skills: string[]
  experienceLevel: "INTERN" | "JUNIOR" | "MID" | "SENIOR" | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export function ProfileClient() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [resumeText, setResumeText] = useState("")
  const [parsedResume, setParsedResume] = useState<ResumeParseResponse | null>(
    null,
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

      const res = await fetch(
        `${API_URL}/users/profile?email=${encodeURIComponent(session.user.email)}`,
        { cache: "no-store" },
      )
      const data = (await res.json()) as ProfileResponse
      setProfile(data)
    }

    void loadProfile()
  }, [session?.user?.email])

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
    const res = await fetch(
      `${API_URL}/users/profile?email=${encodeURIComponent(email)}`,
      { cache: "no-store" },
    )
    const data = (await res.json()) as ProfileResponse
    setProfile(data)
  }

  async function handleProfileSubmit(formData: FormData) {
    if (!session?.user?.email) return

    setError(null)
    setIsSaving(true)

    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
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

      if (!res.ok) throw new Error("Unable to save profile")

      await refreshProfile(session.user.email)
      toast("Profile saved", {
        description: "Your details are ready for job matching.",
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
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resumeText }),
      })

      if (!res.ok) throw new Error("Could not parse resume")

      const data = (await res.json()) as ResumeParseResponse
      setParsedResume(data)
      toast("Resume parsed", {
        description: "Review the extracted details before applying.",
      })
    } catch {
      toast("Could not parse resume", {
        description: "Please try again with more detail.",
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
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          name: profile?.user?.name ?? session.user.name ?? "",
          location:
            parsedResume.location ?? profile?.profile?.location ?? "",
          skills:
            parsedResume.skills.join(", ") ||
            profile?.profile?.skills ||
            "",
          experienceLevel:
            parsedResume.experienceLevel ??
            profile?.profile?.experienceLevel ??
            null,
          resumeUrl: profile?.profile?.resumeUrl ?? "",
        }),
      })

      if (!res.ok) throw new Error("Could not apply parsed resume")

      await refreshProfile(session.user.email)
      toast("Resume insights applied", {
        description: "Your profile was updated from the parsed resume.",
      })
    } catch {
      setError("Could not apply parsed resume right now.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isPending || !session?.user) {
    return (
      <SidebarLayout current="profile">
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <p className="text-sm text-muted-foreground">
            Loading profile...
          </p>
        </div>
      </SidebarLayout>
    )
  }

  const isProfileComplete = Boolean(
    profile?.profile?.location &&
      profile?.profile?.skills &&
      profile?.profile?.experienceLevel,
  )

  return (
    <SidebarLayout current="profile">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-medium tracking-tight">
              Your career profile.
            </h1>
            <p className="text-sm text-muted-foreground">
              This powers job matching, resume insights, and recommendations.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`font-mono text-xs font-semibold tracking-widest uppercase ${
                isProfileComplete
                  ? "text-[var(--amber)]"
                  : "text-muted-foreground"
              }`}
            >
              {isProfileComplete ? "Complete" : "Incomplete"}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Profile form */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-xs font-semibold tracking-widest uppercase">
                Details
              </CardTitle>
              <CardDescription>
                Your skills and experience level drive match scoring across all
                jobs.
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
                      defaultValue={
                        profile?.profile?.experienceLevel ?? ""
                      }
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

                <Button
                  disabled={isSaving}
                  type="submit"
                  className="bg-[var(--amber)] text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
                >
                  {isSaving ? "Saving profile..." : "Save profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Resume parsing */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-mono text-xs font-semibold tracking-widest uppercase">
                  Resume parsing
                </CardTitle>
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
                  className="bg-[var(--amber)] text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
                >
                  {isParsingResume ? "Parsing resume..." : "Parse resume"}
                </Button>

                {parsedResume ? (
                  <div className="border border-border bg-secondary/30 p-4">
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="font-mono text-xs font-semibold tracking-widest uppercase text-[var(--amber)]">
                          Detected location
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {parsedResume.location ??
                            "No location detected yet"}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-xs font-semibold tracking-widest uppercase text-[var(--amber)]">
                          Detected experience level
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {parsedResume.experienceLevel ??
                            "No experience level detected yet"}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-xs font-semibold tracking-widest uppercase text-[var(--amber)]">
                          Detected skills
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
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
          </div>
        </div>
      </section>
    </SidebarLayout>
  )
}
