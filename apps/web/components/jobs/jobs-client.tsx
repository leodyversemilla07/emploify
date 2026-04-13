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
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { SidebarLayout } from "@/components/sidebar-layout"
import { useSession } from "@/lib/auth-client"

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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export function JobsClient() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [jobs, setJobs] = useState<JobItem[]>([])
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
  const [isSyncing, setIsSyncing] = useState(false)
  const [search, setSearch] = useState("")
  const [location, setLocation] = useState("")
  const [source, setSource] = useState("")
  const [experienceLevel, setExperienceLevel] = useState("")
  const [remoteOnly, setRemoteOnly] = useState(false)

  const loadSyncStatus = useCallback(async () => {
    const res = await fetch(`${API_URL}/jobs/sync/status`, {
      cache: "no-store",
    })
    const data = (await res.json()) as { lastRun: SyncRun | null }
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
    const query = new URLSearchParams({
      email: session.user.email,
    })

    if (search) query.set("search", search)
    if (location) query.set("location", location)
    if (source) query.set("source", source)
    if (experienceLevel) query.set("experienceLevel", experienceLevel)
    if (remoteOnly) query.set("remote", "true")

    const res = await fetch(`${API_URL}/jobs?${query.toString()}`, {
      cache: "no-store",
    })
    const data = (await res.json()) as JobItem[]
    setJobs(data)
    setIsLoading(false)
  }, [
    experienceLevel,
    location,
    remoteOnly,
    search,
    session?.user?.email,
    source,
  ])

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login")
    }
  }, [isPending, router, session])

  useEffect(() => {
    void loadJobs()
    void loadSyncStatus()
  }, [loadJobs, loadSyncStatus])

  const resultLabel = useMemo(() => {
    if (isLoading) return "Loading roles..."
    if (jobs.length === 0) return "No roles found"
    return `${jobs.length} role${jobs.length === 1 ? "" : "s"} found`
  }, [isLoading, jobs.length])

  async function handleSyncJobs() {
    setIsSyncing(true)

    try {
      const res = await fetch(`${API_URL}/jobs/sync`, {
        method: "POST",
      })

      if (!res.ok) {
        throw new Error("Could not sync jobs")
      }

      const data = (await res.json()) as {
        imported: number
        sources: string[]
        providerResults: Array<{
          source: string
          status: string
          imported: number
          message: string
        }>
        lastRun: SyncRun
      }
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

    const res = await fetch(`${API_URL}/jobs/save`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: session.user.email,
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
        email: session.user.email,
        jobId,
      })

      const res = await fetch(`${API_URL}/ai/match?${query.toString()}`, {
        cache: "no-store",
      })

      if (!res.ok) {
        throw new Error("Could not fetch match")
      }

      const data = (await res.json()) as MatchInsight
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
        email: session.user.email,
        jobId,
      })

      const res = await fetch(
        `${API_URL}/ai/match/explain?${query.toString()}`,
        {
          cache: "no-store",
        }
      )

      if (!res.ok) {
        throw new Error("Could not fetch explanation")
      }

      const data = (await res.json()) as MatchExplanation
      setExplanations((current) => ({ ...current, [jobId]: data }))
    } catch {
      toast("Could not generate AI explanation", {
        description: "Please try again later.",
      })
    } finally {
      setLoadingExplanations((current) => ({ ...current, [jobId]: false }))
    }
  }

  if (isPending || !session?.user) {
    return (
      <SidebarLayout current="jobs">
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <p className="text-sm text-muted-foreground">Loading jobs...</p>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout current="jobs">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-medium tracking-tight">
              Find roles that fit your profile.
            </h1>
            <p className="text-sm text-muted-foreground">
              Search across sample ATS listings now, then connect Greenhouse,
              Lever, and Ashby sources through the sync flow.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => void handleSyncJobs()}
              className="bg-[var(--amber)] text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
            >
              {isSyncing ? "Syncing jobs..." : "Sync sources"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/tracker">Open tracker</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Source sync status</CardTitle>
            <CardDescription>
              Review the latest import run before browsing newly synced jobs.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border bg-background p-4">
                <p className="text-xs text-muted-foreground">Last status</p>
                <p className="text-sm font-medium">
                  {lastRun?.status ?? "Not run yet"}
                </p>
              </div>
              <div className="rounded-lg border bg-background p-4">
                <p className="text-xs text-muted-foreground">Imported</p>
                <p className="text-sm font-medium">{lastRun?.imported ?? 0}</p>
              </div>
              <div className="rounded-lg border bg-background p-4">
                <p className="text-xs text-muted-foreground">Sources</p>
                <p className="text-sm font-medium">{lastRun?.sources || "—"}</p>
              </div>
              <div className="rounded-lg border bg-background p-4">
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-sm font-medium">
                  {lastRun?.completedAt
                    ? new Date(lastRun.completedAt).toLocaleString()
                    : "—"}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {syncDetails?.summary ??
                lastRun?.details ??
                "Configure provider env vars and run a sync to import live jobs."}
            </p>
            {syncDetails?.providers?.length ? (
              <div className="grid gap-3 md:grid-cols-3">
                {syncDetails.providers.map((provider) => (
                  <div
                    key={provider.source}
                    className="rounded-lg border bg-background p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{provider.source}</p>
                      <p className="text-xs text-muted-foreground">
                        {provider.status}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Imported {provider.imported} role
                      {provider.imported === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {provider.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Start with simple filters from the PRD: role, location, source,
              remote, and experience level.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                  <FieldDescription>
                    Use the enum values from the dashboard for now.
                  </FieldDescription>
                </Field>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

        <div className="grid gap-4">
          {jobs.map((job) => {
            const match = matches[job.id]
            const isMatchLoading = loadingMatches[job.id]

            return (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <CardTitle>{job.title}</CardTitle>
                        <CardDescription>
                          {job.company} · {job.location ?? "Location flexible"}
                        </CardDescription>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {job.source} ·{" "}
                        {job.remote ? "Remote" : "On-site / Hybrid"}
                        {job.experienceLevel ? ` · ${job.experienceLevel}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <Button
                        disabled={job.saved}
                        onClick={() => void handleSaveJob(job.id)}
                        variant={job.saved ? "secondary" : "outline"}
                      >
                        {job.saved ? "Saved" : "Save job"}
                      </Button>
                      <Button
                        onClick={() => void handleCheckMatch(job.id)}
                        size="sm"
                        variant="ghost"
                      >
                        {isMatchLoading
                          ? "Checking match..."
                          : "Check AI match"}
                      </Button>
                      <Button
                        disabled={!match}
                        onClick={() => void handleExplainMatch(job.id)}
                        size="sm"
                        variant="ghost"
                      >
                        {loadingExplanations[job.id]
                          ? "Generating explanation..."
                          : "Explain with AI"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="text-sm leading-7 text-muted-foreground">
                    {job.description}
                  </p>

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
                              <li key={item}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex flex-col gap-2">
                          <p className="text-sm font-medium">Missing skills</p>
                          <p className="text-sm text-muted-foreground">
                            {match.missingSkills.length > 0
                              ? match.missingSkills.join(", ")
                              : "No major skill gaps detected from the current heuristic."}
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
      </section>
    </SidebarLayout>
  )
}
