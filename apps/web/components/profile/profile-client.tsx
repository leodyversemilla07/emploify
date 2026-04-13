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
import { useEffect, useState } from "react"
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

  // Form state
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [skills, setSkills] = useState("")
  const [experienceLevel, setExperienceLevel] = useState("")
  const [resumeUrl, setResumeUrl] = useState("")

  // Resume parsing
  const [resumeText, setResumeText] = useState("")
  const [isParsing, setIsParsing] = useState(false)
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

      // Populate form from loaded profile
      setName(data.user?.name ?? session.user.name ?? "")
      setLocation(data.profile?.location ?? "")
      setSkills(data.profile?.skills ?? "")
      setExperienceLevel(data.profile?.experienceLevel ?? "")
      setResumeUrl(data.profile?.resumeUrl ?? "")
    }

    void loadProfile()
  }, [session?.user?.email])

  async function handleSaveProfile() {
    if (!session?.user?.email) return

    setError(null)
    setIsSaving(true)

    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          name: name.trim(),
          location: location.trim(),
          skills: skills.trim(),
          experienceLevel: experienceLevel.trim() || null,
          resumeUrl: resumeUrl.trim(),
        }),
      })

      if (!res.ok) throw new Error("Save failed")

      toast("Profile saved", {
        description: "Your profile was updated. Match scores will reflect the changes.",
      })
    } catch {
      setError("Could not save your profile right now.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleParseAndAutoFill() {
    if (!resumeText.trim()) {
      toast("Paste resume text first", {
        description: "Add resume content to extract skills and experience.",
      })
      return
    }

    setIsParsing(true)

    try {
      const res = await fetch(`${API_URL}/ai/parse-resume`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resumeText }),
      })

      if (!res.ok) throw new Error("Parse failed")

      const data = (await res.json()) as ResumeParseResponse

      // Auto-fill form fields (only overwrite if parse found something)
      if (data.location) setLocation(data.location)
      if (data.skills.length > 0) setSkills(data.skills.join(", "))
      if (data.experienceLevel) setExperienceLevel(data.experienceLevel)

      toast("Resume parsed", {
        description: `Found ${data.skills.length} skills${data.experienceLevel ? `, ${data.experienceLevel.toLowerCase()} level` : ""}. Review and save.`,
      })
    } catch {
      toast("Could not parse resume", {
        description: "Try pasting more detailed resume text.",
      })
    } finally {
      setIsParsing(false)
    }
  }

  if (isPending || !session?.user) {
    return (
      <SidebarLayout current="profile">
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Loading profile...
          </p>
        </div>
      </SidebarLayout>
    )
  }

  const isProfileComplete = Boolean(
    skills.trim() && experienceLevel,
  )

  return (
    <SidebarLayout current="profile">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-medium tracking-tight">
              Your career profile.
            </h1>
            <p className="text-sm text-muted-foreground">
              This powers job matching, resume insights, and recommendations.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
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

        {/* Resume parser — top, prominent */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs font-semibold tracking-widest uppercase">
              Paste your resume
            </CardTitle>
            <CardDescription>
              Paste your resume text below and we will extract skills,
              experience level, and location automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Textarea
              placeholder="Paste your resume text here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="min-h-[160px]"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                disabled={isParsing}
                onClick={() => void handleParseAndAutoFill()}
                className="bg-[var(--amber)] text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
              >
                {isParsing ? "Parsing..." : "Parse & auto-fill"}
              </Button>
              {skills.trim() || experienceLevel ? (
                <span className="flex items-center text-xs text-muted-foreground">
                  Fields below were auto-filled. Review and save.
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Profile form */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs font-semibold tracking-widest uppercase">
              Details
            </CardTitle>
            <CardDescription>
              Edit the fields below or use the resume parser above to fill them
              automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Full name</FieldLabel>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="location">Location</FieldLabel>
                  <Input
                    id="location"
                    placeholder="Manila, Philippines"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="skills">Skills</FieldLabel>
                  <Input
                    id="skills"
                    placeholder="React, TypeScript, NestJS"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                  />
                  <FieldDescription>
                    Separate skills with commas.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="experienceLevel">
                    Experience level
                  </FieldLabel>
                  <Input
                    id="experienceLevel"
                    placeholder="INTERN, JUNIOR, MID, SENIOR"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value.toUpperCase())}
                  />
                  <FieldDescription>
                    Use INTERN, JUNIOR, MID, or SENIOR.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="resumeUrl">Resume URL</FieldLabel>
                  <Input
                    id="resumeUrl"
                    placeholder="https://example.com/resume.pdf"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                  />
                </Field>
              </FieldGroup>

              {error ? <FieldError>{error}</FieldError> : null}

              <Button
                disabled={isSaving}
                onClick={() => void handleSaveProfile()}
                className="bg-[var(--amber)] text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
              >
                {isSaving ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </SidebarLayout>
  )
}
