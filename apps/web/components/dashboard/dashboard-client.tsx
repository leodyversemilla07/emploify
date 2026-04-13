"use client"

import { Button } from "@workspace/ui/components/button"
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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export function DashboardClient() {
  const { data: session, isPending } = useSession()
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [recommendations, setRecommendations] =
    useState<RecommendationsResponse | null>(null)

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

  const isProfileComplete = Boolean(
    profile?.profile?.location &&
      profile?.profile?.skills &&
      profile?.profile?.experienceLevel,
  )

  if (isPending || !session?.user) {
    return (
      <SidebarLayout current="dashboard">
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <p className="text-sm text-muted-foreground">
            Loading your workspace...
          </p>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout current="dashboard">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
          <Card className="border border-border">
            <CardHeader>
              <CardDescription className="font-mono text-xs font-semibold tracking-widest uppercase">
                Profile status
              </CardDescription>
              <CardTitle className="text-2xl font-semibold font-mono">
                {isProfileComplete ? "Ready" : "Incomplete"}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Profile summary + link */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-xs font-semibold tracking-widest uppercase">
                Profile
              </CardTitle>
              <CardDescription>
                Your skills and experience level power job matching and
                recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <div className="border border-border bg-secondary/30 p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xs font-semibold tracking-widest uppercase text-[var(--amber)]">
                        Status
                      </p>
                      <p className="text-sm font-medium">
                        {isProfileComplete ? "Ready" : "Incomplete"}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isProfileComplete
                        ? "Your profile is set. Update skills or parse a new resume anytime."
                        : "Complete your profile to unlock match scoring."}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                asChild
                className="bg-[var(--amber)] text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
              >
                <Link href="/profile">Edit profile</Link>
              </Button>
            </CardContent>
          </Card>

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
        </div>
      </section>
    </SidebarLayout>
  )
}
