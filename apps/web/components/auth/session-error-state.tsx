"use client"

import { Button } from "@workspace/ui/components/button"

import { SidebarLayout } from "@/components/sidebar-layout"

type SessionErrorStateProps = {
  current: "dashboard" | "jobs" | "profile" | "tracker"
  onRetry: () => unknown | Promise<unknown>
}

export function SessionErrorState({ current, onRetry }: SessionErrorStateProps) {
  return (
    <SidebarLayout current={current}>
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <h1 className="text-2xl font-medium tracking-tight">
          We couldn’t verify your session.
        </h1>
        <p className="text-sm text-muted-foreground">
          Please retry in a moment. If the problem persists, check the API auth
          service.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() => void onRetry()}
            className="bg-[var(--amber)] text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
          >
            Retry session check
          </Button>
        </div>
      </section>
    </SidebarLayout>
  )
}
