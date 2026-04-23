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
import { Separator } from "@workspace/ui/components/separator"
import Link from "next/link"
import { useEffect, useState } from "react"

import { SidebarLayout } from "@/components/sidebar-layout"
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

type TopMatch = {
  id: string
  title: string
  company: string
  location: string | null
  remote: boolean
  matchScore: number | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export function DashboardClient() {
  const { data: session, error, isPending } = useSession()
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [recommendations, setRecommendations] =
    useState<RecommendationsResponse | null>(null)
  const [topMatches, setTopMatches] = useState<TopMatch[]>([])

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.email) return

      const [profileRes, analyticsRes, recommendationsRes, jobsRes] = await Promise.all([
        fetch(`${API_URL}/users/profile`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`${API_URL}/applications/analytics`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`${API_URL}/ai/recommendations`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`${API_URL}/jobs`, {
          cache: "no-store",
          credentials: "include",
        }),
      ])

      const profileData = (await profileRes.json()) as ProfileResponse
      const analyticsData = (await analyticsRes.json()) as AnalyticsResponse
      const recommendationsData =
        (await recommendationsRes.json()) as RecommendationsResponse
      const jobsData = (await jobsRes.json()) as TopMatch[]
      setProfile(profileData)
      setAnalytics(analyticsData)
      setRecommendations(recommendationsData)
      setTopMatches(jobsData.filter((j) => j.matchScore !== null).slice(0, 3))
    }

    void loadProfile()
  }, [session?.user?.email])


  if (error) {
    return (
      <SidebarLayout current="dashboard">
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <h1 className="text-2xl font-medium tracking-tight">
            We couldn’t verify your session.
          </h1>
          <p className="text-sm text-muted-foreground">
            Please retry in a moment. If the problem persists, check the API auth
            service.
          </p>
        </section>
      </SidebarLayout>
    )
  }

  if (isPending || !session?.user) {
    return (
      <SidebarLayout current="dashboard">
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-[1.05fr_0.95fr]">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </section>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout current="dashboard">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-medium tracking-tight">
              Welcome back, {session.user.name ?? "there"}.
            </h1>
            <p className="text-sm text-muted-foreground">
              Build your profile first, then move into job discovery and
              application tracking.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="bg-[var(--amber)] text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
            >
              <Link href="/jobs">Browse jobs</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tracker">Open tracker</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-border">
            <CardHeader>
              <CardDescription className="font-mono text-xs font-semibold tracking-widest uppercase">
                Saved jobs
              </CardDescription>
              <CardTitle className="text-2xl font-semibold font-mono">
                {profile?.metrics?.savedJobs ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border border-border">
            <CardHeader>
              <CardDescription className="font-mono text-xs font-semibold tracking-widest uppercase">
                Total applications
              </CardDescription>
              <CardTitle className="text-2xl font-semibold font-mono">
                {analytics?.totalApplications ??
                  profile?.metrics?.applications ??
                  0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border border-border">
            <CardHeader>
              <CardDescription className="font-mono text-xs font-semibold tracking-widest uppercase">
                Interview rate
              </CardDescription>
              <CardTitle className="text-2xl font-semibold font-mono">
                {analytics?.interviewRate ?? 0}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border border-border">
            <CardHeader>
              <CardDescription className="font-mono text-xs font-semibold tracking-widest uppercase">
                Offer rate
              </CardDescription>
              <CardTitle className="text-2xl font-semibold font-mono">
                {analytics?.offerRate ?? 0}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {topMatches.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-xs font-semibold tracking-widest uppercase">
                Top matches
              </CardTitle>
              <CardDescription>
                Jobs that best fit your profile, sorted by match score.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {topMatches.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-background p-4"
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.company}
                      {job.location ? ` \u00b7 ${job.location}` : ""}
                      {job.remote ? " \u00b7 Remote" : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold text-[var(--amber)]">
                    {job.matchScore}%
                  </span>
                </div>
              ))}
              <Button asChild variant="outline" size="sm">
                <Link href="/jobs">Browse all jobs</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-col gap-6">
          <Card>
              <CardHeader>
                <CardTitle className="font-mono text-xs font-semibold tracking-widest uppercase">
                  Analytics funnel
                </CardTitle>
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
                  <Button
                    asChild
                    className="bg-[var(--amber)] text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
                  >
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
      </section>
    </SidebarLayout>
  )
}
