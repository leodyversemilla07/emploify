import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"

/* --- SVG Icons (custom, no emoji) --- */
function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function IconLayout({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
    >
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  )
}

function IconTarget({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4", className)}
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-3.5", className)}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

/* --- Animated grid background --- */
function GridBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.035]">
      <div
        className="animate-grid-drift absolute -inset-[100%]"
        style={{
          backgroundImage: `
            linear-gradient(var(--foreground) 1px, transparent 1px),
            linear-gradient(90deg, var(--foreground) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  )
}

/* --- Amber accent stripe --- */
function AccentStripe({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-1 w-16 bg-[var(--amber)] sm:w-24",
        className,
      )}
    />
  )
}

/* --- Stat block --- */
function Stat({
  value,
  label,
  delay,
}: {
  value: string
  label: string
  delay: string
}) {
  return (
    <div
      className={cn("animate-fade-up opacity-0", delay)}
    >
      <p className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  )
}

/* --- Feature card --- */
function FeatureCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: typeof IconSearch
  title: string
  description: string
  index: number
}) {
  const delays = ["delay-300", "delay-400", "delay-500"]

  return (
    <div
      className={cn(
        "animate-fade-up opacity-0 group relative border border-border bg-card p-6 transition-colors hover:border-[var(--amber)]/40",
        delays[index],
      )}
    >
      {/* Top-left corner accent */}
      <div className="absolute top-0 left-0 h-px w-8 bg-[var(--amber)] transition-all group-hover:w-16" />

      <div className="flex flex-col gap-4">
        <div className="flex size-10 items-center justify-center border border-border bg-[var(--amber)]/10 text-[var(--amber)]">
          <Icon />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-mono text-sm font-semibold tracking-tight uppercase">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

/* --- How it works step --- */
function Step({
  number,
  title,
  description,
  delay,
}: {
  number: string
  title: string
  description: string
  delay: string
}) {
  return (
    <div className={cn("animate-fade-up opacity-0 relative flex gap-5", delay)}>
      <div className="flex flex-col items-center">
        <div className="flex size-8 items-center justify-center border border-border bg-card font-mono text-xs font-semibold text-[var(--amber)]">
          {number}
        </div>
        <div className="mt-2 w-px flex-1 bg-border" />
      </div>
      <div className="pb-8">
        <h3 className="font-mono text-sm font-semibold tracking-tight uppercase">
          {title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

/* === PAGE === */
export default function Page() {
  return (
    <main className="relative min-h-svh">
      <GridBackground />

      {/* --- NAV --- */}
      <nav className="animate-fade-in opacity-0 relative z-10 flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="size-6 bg-[var(--amber)]" />
          <span className="font-mono text-sm font-semibold tracking-tight">
            EMPLOIFY
          </span>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </nav>

      {/* --- HERO --- */}
      <section className="relative z-10 px-6 pt-16 pb-20 sm:px-10 lg:pt-24 lg:pb-28">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            {/* Left: headline + subtitle */}
            <div className="flex max-w-2xl flex-col gap-6">
              <AccentStripe className="animate-fade-up opacity-0 delay-100" />

              <h1
                className={cn(
                  "animate-fade-up opacity-0 font-sans text-4xl leading-[1.1] font-medium tracking-tight sm:text-5xl lg:text-6xl",
                  "delay-200",
                )}
              >
                Your job search,
                <br />
                <span className="text-[var(--amber)]">organized.</span>
              </h1>

              <p
                className={cn(
                  "animate-fade-up opacity-0 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg",
                  "delay-300",
                )}
              >
                Save roles, track applications, and see how well you match a
                job before spending time on it. One workspace, zero
                spreadsheets.
              </p>
            </div>

            {/* Right: CTA buttons */}
            <div
              className={cn(
                "animate-fade-up opacity-0 flex flex-col gap-3 sm:flex-row lg:flex-col",
                "delay-400",
              )}
            >
              <Button
                asChild
                size="lg"
                className="h-11 gap-2 bg-[var(--amber)] px-6 text-sm text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
              >
                <Link href="/signup">
                  Create account
                  <IconArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-11 px-6 text-sm"
              >
                <Link href="/login">Sign in</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-11 gap-1 px-6 text-sm text-muted-foreground"
              >
                <Link href="/jobs">
                  Browse demo jobs
                  <IconChevronRight />
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 flex gap-10 border-t border-border pt-8 sm:gap-16">
            <Stat value="3" label="Job sources" delay="delay-500" />
            <Stat value="5" label="Kanban stages" delay="delay-600" />
            <Stat value="1" label="Dashboard view" delay="delay-700" />
          </div>
        </div>
      </section>

      {/* --- FEATURES --- */}
      <section className="relative z-10 border-t border-border bg-secondary/30 px-6 py-16 sm:px-10 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="animate-fade-up opacity-0 mb-12 flex flex-col gap-3 delay-200">
            <p className="font-mono text-xs font-semibold tracking-widest text-[var(--amber)] uppercase">
              Core features
            </p>
            <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">
              Built for focus, not bloat.
            </h2>
          </div>

          <div className="grid gap-px bg-border sm:grid-cols-3">
            {features.map((f, i) => (
              <FeatureCard
                key={f.title}
                icon={f.icon}
                title={f.title}
                description={f.description}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="relative z-10 px-6 py-16 sm:px-10 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-12 lg:flex-row lg:gap-20">
            <div className="animate-fade-up opacity-0 max-w-xs delay-200">
              <p className="font-mono text-xs font-semibold tracking-widest text-[var(--amber)] uppercase">
                How it works
              </p>
              <h2 className="mt-3 text-2xl font-medium tracking-tight sm:text-3xl">
                Three steps.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                No complicated setup. Create an account, sync or browse jobs,
                and start tracking your applications in under a minute.
              </p>
            </div>

            <div className="flex-1">
              <Step
                number="01"
                title="Create your profile"
                description="Add your skills and experience level. Emploify uses this to score every job against your background."
                delay="delay-300"
              />
              <Step
                number="02"
                title="Discover and save roles"
                description="Pull jobs from Greenhouse, Lever, and Ashby automatically. Save the ones that catch your eye."
                delay="delay-400"
              />
              <Step
                number="03"
                title="Track and apply"
                description="Move roles through a kanban board from Saved to Applied to Interview. See your conversion rate on the dashboard."
                delay="delay-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- BOTTOM CTA --- */}
      <section className="relative z-10 border-t border-border px-6 py-16 sm:px-10">
        <div className="animate-fade-up opacity-0 delay-200 mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-medium tracking-tight sm:text-2xl">
              Start tracking today.
            </h2>
            <p className="text-sm text-muted-foreground">
              No credit card. No noise. Just your job search, simplified.
            </p>
          </div>
          <Button
            asChild
            className="h-11 gap-2 bg-[var(--amber)] px-6 text-sm text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
          >
            <Link href="/signup">
              Get started
              <IconArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 border-t border-border px-6 py-6 sm:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-4 bg-[var(--amber)]" />
            <span className="font-mono text-xs font-semibold tracking-tight text-muted-foreground">
              EMPLOIFY
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built for early-career professionals.
          </p>
        </div>
      </footer>
    </main>
  )
}

/* --- Data --- */
const features = [
  {
    icon: IconSearch,
    title: "Job discovery",
    description:
      "Aggregate roles from Greenhouse, Lever, and Ashby in one place. Filter by location, remote status, and experience level.",
  },
  {
    icon: IconLayout,
    title: "Application tracker",
    description:
      "A kanban board with five stages: Saved, Applied, Interview, Offer, Rejected. Drag-and-drop updates with per-role notes.",
  },
  {
    icon: IconTarget,
    title: "Match scoring",
    description:
      "AI-powered match score evaluates your skills, experience, and location against each job. Know your fit before you apply.",
  },
]
