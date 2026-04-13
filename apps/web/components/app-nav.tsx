import { Button } from "@workspace/ui/components/button"
import Link from "next/link"

export function AppNav({ current }: { current?: string }) {
  return (
    <nav className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="size-6 bg-[var(--amber)]" />
          <span className="font-mono text-sm font-semibold tracking-tight">
            EMPLOIFY
          </span>
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          <Button
            asChild
            variant={current === "jobs" ? "secondary" : "ghost"}
            size="sm"
          >
            <Link href="/jobs">Jobs</Link>
          </Button>
          <Button
            asChild
            variant={current === "tracker" ? "secondary" : "ghost"}
            size="sm"
          >
            <Link href="/tracker">Tracker</Link>
          </Button>
          <Button
            asChild
            variant={current === "dashboard" ? "secondary" : "ghost"}
            size="sm"
          >
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {current ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Home</Link>
          </Button>
        ) : null}
        {current ? (
          <Button
            asChild
            size="sm"
            className="bg-[var(--amber)] text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
          >
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-[var(--amber)] text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
            >
              <Link href="/signup">Get started</Link>
            </Button>
          </>
        )}
      </div>
    </nav>
  )
}
