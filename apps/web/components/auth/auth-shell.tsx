import Link from "next/link"
import type { ReactNode } from "react"

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <nav className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="size-6 bg-[var(--amber)]" />
          <span className="font-mono text-sm font-semibold tracking-tight">
            EMPLOIFY
          </span>
        </Link>
      </nav>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          {/* Amber accent stripe */}
          <div className="mb-8 h-1 w-16 bg-[var(--amber)]" />

          <h1 className="font-mono text-sm font-semibold tracking-widest text-[var(--amber)] uppercase">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>

          <div className="mt-8 border-t border-border pt-8">
            {children}
          </div>

          {footer ? (
            <div className="mt-8 border-t border-border pt-6">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
