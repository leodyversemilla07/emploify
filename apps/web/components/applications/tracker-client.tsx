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
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { SessionErrorState } from "@/components/auth/session-error-state"
import { SidebarLayout } from "@/components/sidebar-layout"
import { apiJson } from "@/lib/api"
import { useSession } from "@/lib/auth"

type ApplicationStatus =
  | "SAVED"
  | "APPLIED"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"

type ApplicationItem = {
  id: string
  status: ApplicationStatus
  notes: string | null
  updatedAt: string
  createdAt: string
  job: {
    id: string
    title: string
    company: string
    location: string | null
    source: string
    remote: boolean
  }
}

const columns: ApplicationStatus[] = [
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
]

const nextStatusMap: Record<ApplicationStatus, ApplicationStatus | null> = {
  SAVED: "APPLIED",
  APPLIED: "INTERVIEW",
  INTERVIEW: "OFFER",
  OFFER: null,
  REJECTED: null,
}

const statusLabel: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
}

export function TrackerClient() {
  const router = useRouter()
  const { data: session, error, isPending, refresh } = useSession()
  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({})
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({})
  const [draggedApplicationId, setDraggedApplicationId] = useState<
    string | null
  >(null)
  const [activeDropColumn, setActiveDropColumn] =
    useState<ApplicationStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!isPending && !error && !session?.user) {
      router.replace("/login")
    }
  }, [error, isPending, router, session])

  useEffect(() => {
    async function loadApplications() {
      if (!session?.user?.email) return

      setIsLoading(true)
      setLoadError(null)

      try {
        const data = await apiJson<ApplicationItem[]>("/applications", {
          cache: "no-store",
        })
        setApplications(data)
        setDraftNotes(
          Object.fromEntries(
            data.map((application) => [application.id, application.notes ?? ""])
          )
        )
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not load applications"
        )
      } finally {
        setIsLoading(false)
      }
    }

    void loadApplications()
  }, [session?.user?.email])

  const grouped = useMemo(() => {
    return columns.map((status) => ({
      status,
      items: applications.filter(
        (application) => application.status === status
      ),
    }))
  }, [applications])

  async function updateStatus(
    applicationId: string,
    status: ApplicationStatus
  ) {
    if (!session?.user?.email) return

    let updated: ApplicationItem

    try {
      updated = await apiJson<ApplicationItem>("/applications/status", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          applicationId,
          status,
        }),
      })
    } catch {
      toast("Could not update status", {
        description: "Please try again in a moment.",
      })
      return
    }
    setApplications((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    )
    setDraftNotes((current) => ({
      ...current,
      [updated.id]: updated.notes ?? "",
    }))
    toast("Application updated", {
      description: `Moved to ${status.toLowerCase()}.`,
    })
  }

  async function saveNotes(applicationId: string) {
    if (!session?.user?.email) return

    setSavingNotes((current) => ({ ...current, [applicationId]: true }))

    let updated: ApplicationItem

    try {
      updated = await apiJson<ApplicationItem>("/applications/notes", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          applicationId,
          notes: draftNotes[applicationId] ?? "",
        }),
      })
    } catch {
      setSavingNotes((current) => ({ ...current, [applicationId]: false }))
      toast("Could not save notes", {
        description: "Please try again in a moment.",
      })
      return
    }
    setApplications((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    )
    setDraftNotes((current) => ({
      ...current,
      [updated.id]: updated.notes ?? "",
    }))
    setSavingNotes((current) => ({ ...current, [applicationId]: false }))
    toast("Notes saved", {
      description: "Your application notes were updated.",
    })
  }

  function handleDragStart(applicationId: string) {
    setDraggedApplicationId(applicationId)
  }

  function handleDragEnd() {
    setDraggedApplicationId(null)
    setActiveDropColumn(null)
  }

  async function handleDrop(targetStatus: ApplicationStatus) {
    if (!draggedApplicationId) return

    const application = applications.find(
      (item) => item.id === draggedApplicationId
    )
    setDraggedApplicationId(null)
    setActiveDropColumn(null)

    if (!application || application.status === targetStatus) return

    await updateStatus(draggedApplicationId, targetStatus)
  }

  if (error) {
    return <SessionErrorState current="tracker" onRetry={refresh} />
  }

  if (isPending || !session?.user) {
    return (
      <SidebarLayout current="tracker">
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </section>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout current="tracker">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-medium tracking-tight">
              Move your pipeline forward.
            </h1>
            <p className="text-sm text-muted-foreground">
              Drag cards across saved, applied, interview, offer, and rejected
              columns.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="bg-[var(--amber)] text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
            >
              <Link href="/jobs">Browse jobs</Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Loading your applications...
              </p>
            </CardContent>
          </Card>
        ) : loadError ? (
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <p className="text-sm text-muted-foreground">{loadError}</p>
              <Button
                onClick={() => {
                  window.location.reload()
                }}
                variant="outline"
              >
                Retry applications
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            {grouped.map((column) => (
              <Card
                key={column.status}
                className={cn(
                  "transition-colors",
                  activeDropColumn === column.status &&
                    "border-primary bg-primary/5"
                )}
                onDragOver={(event) => {
                  event.preventDefault()
                  setActiveDropColumn(column.status)
                }}
                onDragLeave={() => {
                  setActiveDropColumn((current) =>
                    current === column.status ? null : current
                  )
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  void handleDrop(column.status)
                }}
              >
                <CardHeader>
                  <CardTitle className="font-mono text-xs font-semibold tracking-widest uppercase">
                    {statusLabel[column.status]}
                  </CardTitle>
                  <CardDescription>
                    {column.items.length} item
                    {column.items.length === 1 ? "" : "s"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {column.items.length === 0 ? (
                    <div className="rounded-lg border border-dashed bg-background p-4">
                      <p className="text-sm text-muted-foreground">
                        Drop an application here.
                      </p>
                    </div>
                  ) : (
                    column.items.map((application) => {
                      const nextStatus = nextStatusMap[application.status]
                      const isDragging = draggedApplicationId === application.id

                      return (
                        <article
                          aria-grabbed={isDragging}
                          draggable
                          key={application.id}
                          className={cn(
                            "rounded-lg border bg-background p-4 transition-opacity",
                            isDragging && "opacity-50"
                          )}
                          onDragStart={() => handleDragStart(application.id)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium">
                                  {application.job.title}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {application.job.company}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {application.job.remote
                                  ? "Remote"
                                  : "Hybrid / On-site"}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {application.job.location ?? "Location flexible"}{" "}
                              · {application.job.source}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Updated{" "}
                              {new Date(
                                application.updatedAt
                              ).toLocaleDateString()}
                            </p>
                            {application.status === "APPLIED" &&
                            Date.now() - new Date(application.updatedAt).getTime() > 7 * 24 * 60 * 60 * 1000 ? (
                              <p className="font-mono text-[0.65rem] font-semibold tracking-widest text-[var(--amber)] uppercase">
                                Follow up
                              </p>
                            ) : null}
                          </div>
                          <Separator className="my-4" />
                          <div className="flex flex-col gap-3">
                            <Textarea
                              placeholder="Add interview prep notes, next steps, recruiter details..."
                              value={draftNotes[application.id] ?? ""}
                              onChange={(event) =>
                                setDraftNotes((current) => ({
                                  ...current,
                                  [application.id]: event.target.value,
                                }))
                              }
                            />
                            <Button
                              onClick={() => void saveNotes(application.id)}
                              size="sm"
                              variant="outline"
                            >
                              {savingNotes[application.id]
                                ? "Saving notes..."
                                : "Save notes"}
                            </Button>
                            {nextStatus ? (
                              <Button
                                onClick={() =>
                                  void updateStatus(application.id, nextStatus)
                                }
                                size="sm"
                                className="bg-[var(--amber)] text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
                              >
                                Move to {nextStatus.toLowerCase()}
                              </Button>
                            ) : null}
                            {application.status !== "REJECTED" ? (
                              <Button
                                onClick={() =>
                                  void updateStatus(application.id, "REJECTED")
                                }
                                size="sm"
                                variant="ghost"
                              >
                                Mark rejected
                              </Button>
                            ) : null}
                          </div>
                        </article>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </SidebarLayout>
  )
}
