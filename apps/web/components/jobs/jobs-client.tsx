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
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
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
    isAdmin?: boolean
  }
}

type JobItem = {
  id: string
  title: string
  company: string
  location: string | null
  description: string
  source: string
  remote: boolean
  experienceLevel: "INTERN" | "JUNIOR" | "MID" | "SENIOR" | null
  postedAt: string | null
  saved: boolean
  matchScore: number | null
}

type MatchInsight = {
  score: number
  strengths: string[]
  missingSkills: string[]
  matchedSkills: string[]
  profileSkills: string[]
}

type MatchExplanation = {
  explanation: string
  scoreBreakdown: string
  suggestion: string
}

type SyncRun = {
  id: string
  status: string
  imported: number
  sources: string
  details: string | null
  startedAt: string
  completedAt: string | null
}

type SyncDetails = {
  summary?: string
  providers?: Array<{
    source: string
    status: string
    imported: number
    message: string
  }>
}

function JobDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const needsTruncation = text.length > 280

  return (
    <div className="flex flex-col gap-2">
      <p
        className={`text-sm leading-7 text-muted-foreground whitespace-pre-line ${
          !expanded && needsTruncation ? "line-clamp-3" : ""
        }`}
      >
        {text}
      </p>
      {needsTruncation ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="self-start text-xs font-medium text-[var(--amber)] hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  )
}

export function JobsClient() {
  const router = useRouter()
  const { data: session, error, isPending, refresh } = useSession()
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminStateError, setAdminStateError] = useState<string | null>(null)
  const [matches, setMatches] = useState<Record<string, MatchInsight>>({})
  const [loadingMatches, setLoadingMatches] = useState<Record<string, boolean>>(
    {}
  )
  const [explanations, setExplanations] = useState<
    Record<string, MatchExplanation>
  >({})
  const [loadingExplanations, setLoadingExplanations] = useState<
    Record<string, boolean>
  >({})
  const [lastRun, setLastRun] = useState<SyncRun | null>(null)
  const [syncDetails, setSyncDetails] = useState<SyncDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [jobsLoadError, setJobsLoadError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [search, setSearch] = useState("")
  const [location, setLocation] = useState("")
  const [source, setSource] = useState("")
  const [experienceLevel, setExperienceLevel] = useState("")
  const [remoteOnly, setRemoteOnly] = useState(false)

  const loadProfile = useCallback(async () => {
    if (!session?.user?.email) return

    setAdminStateError(null)

    const data = await apiJson<ProfileResponse>("/users/profile", {
      cache: "no-store",
    })
    setIsAdmin(Boolean(data.user?.isAdmin))
  }, [session?.user?.email])

  const loadSyncStatus = useCallback(async () => {
    const data = await apiJson<{ lastRun: SyncRun | null }>(
      "/jobs/sync/status",
      { cache: "no-store" }
    )
    setLastRun(data.lastRun)
    setSyncDetails(
      data.lastRun?.details
        ? (JSON.parse(data.lastRun.details) as SyncDetails)
        : null
    )
  }, [])

  const loadJobs = useCallback(async () => {
    if (!session?.user?.email) return

    setIsLoading(true)
    setJobsLoadError(null)
    const query = new URLSearchParams()

    if (search) query.set("search", search)
    if (location) query.set("location", location)
    if (source) query.set("source", source)
    if (experienceLevel) query.set("experienceLevel", experienceLevel)
    if (remoteOnly) query.set("remote", "true")

    try {
      const data = await apiJson<JobItem[]>(`/jobs?${query.toString()}`, {
        cache: "no-store",
      })
      setJobs(data)
    } catch (error) {
      setJobsLoadError(
        error instanceof Error ? error.message : "Could not load jobs"
      )
      toast("Could not load jobs", {
        description: "Please retry in a moment.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [
    experienceLevel,
    location,
    remoteOnly,
    search,
    session?.user?.email,
    source,
  ])

  useEffect(() => {
    if (!isPending && !error && !session?.user) {
      router.replace("/login")
    }
  }, [error, isPending, router, session])

  useEffect(() => {
    void loadJobs()
  }, [loadJobs])

  useEffect(() => {
    if (!session?.user?.email) return

    void loadSyncStatus().catch(() => {
      toast("Could not load sync status", {
        description: "Please retry in a moment.",
      })
    })
    void loadProfile().catch((loadError) => {
      setIsAdmin(false)
      setAdminStateError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load admin state"
      )
    })
  }, [loadProfile, loadSyncStatus, session?.user?.email])

  const resultLabel = useMemo(() => {
    if (isLoading) return "Loading roles..."
    if (jobs.length === 0) return "No roles found"
    return `${jobs.length} role${jobs.length === 1 ? "" : "s"} found`
  }, [isLoading, jobs.length])

  async function handleSyncJobs() {
    setIsSyncing(true)

    try {
      const data = await apiJson<{
        imported: number
        sources: string[]
        providerResults: Array<{
          source: string
          status: string
          imported: number
          message: string
        }>
        lastRun: SyncRun
      }>("/jobs/sync", { method: "POST" })
      await loadJobs()
      setLastRun(data.lastRun)
      setSyncDetails(
        data.lastRun.details
          ? (JSON.parse(data.lastRun.details) as SyncDetails)
          : null
      )
      toast("Jobs synced", {
        description: `Imported ${data.imported} roles from ${data.sources.join(", ")}.`,
      })
    } catch {
      toast("Could not sync jobs", {
        description:
          "Please verify your provider env configuration and try again.",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  async function handleSaveJob(jobId: string) {
    if (!session?.user?.email) return

    const res = await apiFetch("/jobs/save", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        jobId,
      }),
    })

    if (!res.ok) {
      toast("Could not save job", {
        description: "Please try again in a moment.",
      })
      return
    }

    setJobs((current) =>
      current.map((job) => (job.id === jobId ? { ...job, saved: true } : job))
    )

    toast("Job saved", {
      description: "The role is now in your saved jobs list and tracker.",
    })
  }

  async function handleCheckMatch(jobId: string) {
    if (!session?.user?.email) return

    setLoadingMatches((current) => ({ ...current, [jobId]: true }))

    try {
      const query = new URLSearchParams({
        jobId,
      })

      const data = await apiJson<MatchInsight>(`/ai/match?${query.toString()}`, {
        cache: "no-store",
      })
      setMatches((current) => ({ ...current, [jobId]: data }))
    } catch {
      toast("Could not generate match insight", {
        description: "Please complete your profile and try again.",
      })
    } finally {
      setLoadingMatches((current) => ({ ...current, [jobId]: false }))
    }
  }

  async function handleExplainMatch(jobId: string) {
    if (!session?.user?.email) return

    setLoadingExplanations((current) => ({ ...current, [jobId]: true }))

    try {
      const query = new URLSearchParams({
        jobId,
      })

      const data = await apiJson<MatchExplanation>(
        `/ai/match/explain?${query.toString()}`,
        { cache: "no-store" }
      )
      setExplanations((current) => ({ ...current, [jobId]: data }))
    } catch {
      toast("Could not generate AI explanation", {
        description: "Please try again later.",
      })
    } finally {
      setLoadingExplanations((current) => ({ ...current, [jobId]: false }))
    }
  }

  if (error) {
    return <SessionErrorState current="jobs" onRetry={refresh} />
  }

  if (isPending || !session?.user) {
    return (
      <SidebarLayout current="jobs">
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-48" />
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </section>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout current="jobs">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-medium tracking-tight">
              Find roles that fit your profile.
            </h1>
            <p className="text-sm text-muted-foreground">
              Jobs are scored against your profile automatically. Highest
              matches appear first.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {isAdmin ? (
              <Button
                onClick={() => void handleSyncJobs()}
                disabled={isSyncing}
                className="bg-[var(--amber)] text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
              >
                {isSyncing ? "Syncing jobs..." : "Sync jobs"}
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/tracker">Open tracker</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter by role, location, source, remote, and experience level.
            </CardDescription>
            {lastRun ? (
              <p className="text-xs text-muted-foreground">
                Last sync: {lastRun.status.toLowerCase()} · {new Date(lastRun.startedAt).toLocaleString()}
              </p>
            ) : null}
            {isAdmin && syncDetails?.summary ? (
              <p className="text-xs text-muted-foreground">{syncDetails.summary}</p>
            ) : null}
            {adminStateError ? (
              <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  We couldn’t verify admin access for sync controls. Retry to check your permissions.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void loadProfile().catch((loadError) => {
                      setIsAdmin(false)
                      setAdminStateError(
                        loadError instanceof Error
                          ? loadError.message
                          : "Failed to load admin state"
                      )
                    })
                  }}
                >
                  Retry admin check
                </Button>
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field>
                  <FieldLabel htmlFor="search">Role or keyword</FieldLabel>
                  <Input
                    id="search"
                    placeholder="Frontend, React, NestJS"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="location">Location</FieldLabel>
                  <Input
                    id="location"
                    placeholder="Remote or city"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="source">Source</FieldLabel>
                  <Input
                    id="source"
                    placeholder="Greenhouse, Lever"
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                  />
                </Field>
                  <Field>
                    <FieldLabel htmlFor="experienceLevel">
                      Experience level
                    </FieldLabel>
                    <Input
                      id="experienceLevel"
                      placeholder="INTERN, JUNIOR, MID"
                      value={experienceLevel}
                      onChange={(event) =>
                        setExperienceLevel(event.target.value.toUpperCase())
                      }
                    />
                  </Field>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <Button
                  onClick={() => setRemoteOnly((current) => !current)}
                  type="button"
                  variant={remoteOnly ? "default" : "outline"}
                >
                  {remoteOnly ? "Remote only enabled" : "Remote only"}
                </Button>
                <p className="text-sm text-muted-foreground">{resultLabel}</p>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        {jobsLoadError ? (
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Could not load jobs.</p>
                <p className="text-sm text-muted-foreground">{jobsLoadError}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => void loadJobs()}
              >
                Retry jobs
              </Button>
            </CardContent>
          </Card>
        ) : (
        <div className="grid gap-4">
          {jobs.map((job) => {
            const match = matches[job.id]
            const isMatchLoading = loadingMatches[job.id]

            return (
              <Card key={job.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            {job.company}
                          </p>
                          {job.matchScore !== null ? (
                            <span className="font-mono text-xs font-semibold text-[var(--amber)]">
                              {job.matchScore}%
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                          {job.source}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                          {job.remote ? "Remote" : "On-site"}
                        </span>
                        {job.experienceLevel ? (
                          <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                            {job.experienceLevel}
                          </span>
                        ) : null}
                        {job.location ? (
                          <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                            {job.location}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
                      <Button
                        disabled={job.saved}
                        onClick={() => void handleSaveJob(job.id)}
                        variant={job.saved ? "secondary" : "outline"}
                        size="sm"
                      >
                        {job.saved ? "Saved" : "Save job"}
                      </Button>
                      <Button
                        onClick={() => void handleCheckMatch(job.id)}
                        size="sm"
                        variant="ghost"
                      >
                        {isMatchLoading
                          ? "Checking..."
                          : "Check AI match"}
                      </Button>
                      <Button
                        disabled={!match}
                        onClick={() => void handleExplainMatch(job.id)}
                        size="sm"
                        variant="ghost"
                      >
                        {loadingExplanations[job.id]
                          ? "Explaining..."
                          : "Explain"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pt-0">
                  <JobDescription text={job.description} />

                  {match ? (
                    <div className="border border-border bg-secondary/30 p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-mono text-xs font-semibold tracking-widest text-[var(--amber)] uppercase">
                            AI match insight
                          </p>
                          <p className="font-mono text-sm font-semibold text-[var(--amber)]">{match.score}%</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <p className="text-sm font-medium">Strengths</p>
                          <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                            {match.strengths.map((item) => (
                              <li key={item}>- {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex flex-col gap-2">
                          <p className="text-sm font-medium">Missing skills</p>
                          <p className="text-sm text-muted-foreground">
                            {match.missingSkills.length > 0
                              ? match.missingSkills.join(", ")
                              : "No major skill gaps detected."}
                          </p>
                        </div>
                        {explanations[job.id] ? (
                          <>
                            <Separator />
                            <div className="flex flex-col gap-2">
                              <p className="text-sm font-medium">
                                AI explanation
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {explanations[job.id]?.explanation}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <p className="text-sm font-medium">
                                Score breakdown
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {explanations[job.id]?.scoreBreakdown}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <p className="text-sm font-medium">Suggestion</p>
                              <p className="text-sm text-muted-foreground">
                                {explanations[job.id]?.suggestion}
                              </p>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <Separator />
                  <p className="text-xs text-muted-foreground">
                    Posted{" "}
                    {job.postedAt
                      ? new Date(job.postedAt).toLocaleDateString()
                      : "recently"}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
        )}
      </section>
    </SidebarLayout>
  )
}
