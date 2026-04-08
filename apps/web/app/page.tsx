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

const highlights = [
  "Track applications in one place",
  "Review fit before you apply",
  "Stay focused with a simple workflow",
]

export default function Page() {
  return (
    <main className="min-h-svh bg-background">
      <section className="mx-auto flex min-h-svh w-full max-w-4xl flex-col justify-center gap-10 px-6 py-12">
        <div className="flex flex-col gap-5">
          <p className="text-sm font-medium text-muted-foreground">Emploify</p>

          <div className="flex flex-col gap-4">
            <h1 className="max-w-3xl text-4xl font-medium tracking-tight text-balance sm:text-5xl">
              A calm workspace for your job search.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Save roles, track progress, and understand how well you match a
              job before you spend time applying.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">Create account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/jobs">Browse demo jobs</Link>
            </Button>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((highlight) => (
            <Card key={highlight}>
              <CardHeader>
                <CardTitle className="text-base">{highlight}</CardTitle>
                <CardDescription>
                  Built to reduce noise and keep your search moving.
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Start simply.</p>
              <p className="text-sm text-muted-foreground">
                Organize applications now and expand your workflow later.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/signup">Get started</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
