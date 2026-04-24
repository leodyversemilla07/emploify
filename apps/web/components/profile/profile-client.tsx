"use client"

import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
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

import { SessionErrorState } from "@/components/auth/session-error-state"
import { SidebarLayout } from "@/components/sidebar-layout"
import { apiFetch, apiJson } from "@/lib/api"
import { useSession } from "@/lib/auth"

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

type ResumeUploadResponse = {
  resumeUrl: string
  parseStatus: "parsed" | "uploaded"
  parsedProfile: ResumeParseResponse | null
}

export function ProfileClient() {
  const router = useRouter()
  const { data: session, error: sessionError, isPending, refresh } = useSession()
  const [profile, setProfile] = useState<ProfileResponse | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [skills, setSkills] = useState("")
  const [experienceLevel, setExperienceLevel] = useState("")
  const [resumeUrl, setResumeUrl] = useState("")

  // Resume parsing
  const [resumeText, setResumeText] = useState("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!isPending && !sessionError && !session?.user) {
      router.replace("/login")
    }
  }, [isPending, router, session, sessionError])

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.email) return

      try {
        setLoadError(null)
        const data = await apiJson<ProfileResponse>("/users/profile", {
          cache: "no-store",
        })
        setProfile(data)

        // Populate form from loaded profile
        setName(data.user?.name ?? session.user.name ?? "")
        setLocation(data.profile?.location ?? "")
        setSkills(data.profile?.skills ?? "")
        setExperienceLevel(data.profile?.experienceLevel ?? "")
        setResumeUrl(data.profile?.resumeUrl ?? "")
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : "Could not load profile"
        )
      }
    }

    void loadProfile()
  }, [session?.user?.email])

  async function handleSaveProfile() {
    if (!session?.user?.email) return

    setError(null)
    setIsSaving(true)

    try {
      const res = await apiFetch("/users/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim(),
          skills: skills.trim(),
          experienceLevel: experienceLevel.trim() || null,
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

  async function handleUploadResume() {
    if (!resumeFile) {
      toast("Choose a resume first", {
        description: "Upload a TXT, PDF, DOC, or DOCX file.",
      })
      return
    }

    setIsUploadingResume(true)

    try {
      const formData = new FormData()
      formData.set("file", resumeFile)

      const data = await apiJson<ResumeUploadResponse>(
        "/users/profile/resume",
        {
          method: "POST",
          body: formData,
        }
      )
      setResumeUrl(data.resumeUrl)

      if (data.parsedProfile?.location) setLocation(data.parsedProfile.location)
      if (data.parsedProfile?.skills?.length) {
        setSkills(data.parsedProfile.skills.join(", "))
      }
      if (data.parsedProfile?.experienceLevel) {
        setExperienceLevel(data.parsedProfile.experienceLevel)
      }

      toast("Resume uploaded", {
        description:
          data.parseStatus === "parsed"
            ? "Your resume was uploaded and parsed. Review the profile fields below."
            : "Your resume was uploaded. Automatic parsing currently works for text files.",
      })
    } catch {
      toast("Could not upload resume", {
        description: "Please try again with a supported file.",
      })
    } finally {
      setIsUploadingResume(false)
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
      const data = await apiJson<ResumeParseResponse>("/ai/parse-resume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resumeText }),
      })

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

  if (sessionError) {
    return <SessionErrorState current="profile" onRetry={refresh} />
  }

  if (isPending || !session?.user) {
    return (
      <SidebarLayout current="profile">
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-56" />
          <Skeleton className="h-80" />
        </section>
      </SidebarLayout>
    )
  }

  const isProfileComplete = Boolean(
    skills.trim() && experienceLevel,
  )

  if (loadError) {
    return (
      <SidebarLayout current="profile">
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <h1 className="text-2xl font-medium tracking-tight">
            We couldn’t load your profile.
          </h1>
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <Button
            onClick={() => {
              window.location.reload()
            }}
            className="bg-[var(--amber)] text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
          >
            Retry profile
          </Button>
        </section>
      </SidebarLayout>
    )
  }

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

        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-xs font-semibold tracking-widest uppercase">
              Upload your resume
            </CardTitle>
            <CardDescription>
              Upload a resume file to attach it to your profile. Text files are
              parsed automatically; PDF and Word uploads are stored for now.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              accept=".txt,.pdf,.doc,.docx"
              type="file"
              onChange={(event) =>
                setResumeFile(event.target.files?.[0] ?? null)
              }
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                disabled={isUploadingResume}
                onClick={() => void handleUploadResume()}
                className="bg-[var(--amber)] text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
              >
                {isUploadingResume ? "Uploading..." : "Upload resume"}
              </Button>
              {resumeUrl ? (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[var(--amber)] underline underline-offset-4"
                >
                  View current resume
                </a>
              ) : null}
            </div>
          </CardContent>
        </Card>

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
                  <FieldLabel htmlFor="resumeUrl">Resume</FieldLabel>
                  <Input
                    id="resumeUrl"
                    readOnly
                    value={resumeUrl}
                    placeholder="Upload a resume to attach it to your profile"
                  />
                  <FieldDescription>
                    Resume attachments are managed through the upload flow above.
                  </FieldDescription>
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
