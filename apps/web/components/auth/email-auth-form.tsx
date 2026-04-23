"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Spinner } from "@workspace/ui/components/spinner"
import { useMemo, useState } from "react"
import { useAuthActions } from "@/lib/auth"

export function EmailAuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter()
  const { signIn, signUp } = useAuthActions()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const isSignup = mode === "signup"
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"
  const githubEnabled = process.env.NEXT_PUBLIC_GITHUB_AUTH_ENABLED === "true"
  const hasSocialAuth = googleEnabled || githubEnabled
  const submitLabel = isPending
    ? isSignup
      ? "Creating account..."
      : "Signing in..."
    : isSignup
      ? "Create account"
      : "Sign in"

  const passwordMismatch = useMemo(() => {
    if (!isSignup || !confirmPassword) return false
    return password !== confirmPassword
  }, [confirmPassword, isSignup, password])

  async function handleSocialSignIn(provider: "google" | "github") {
    setError(null)
    setIsPending(true)

    try {
      const result = await signIn.social({
        provider,
        callbackURL: "/dashboard",
      })

      if (result.error) {
        setError(result.error.message ?? `Unable to continue with ${provider}.`)
      }
    } catch {
      setError(`Unable to continue with ${provider}.`)
    } finally {
      setIsPending(false)
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    setIsPending(true)

    const name = String(formData.get("name") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()
    const submittedPassword = String(formData.get("password") ?? "")
    const confirm = String(formData.get("confirmPassword") ?? "")

    if (isSignup && submittedPassword !== confirm) {
      setError("Passwords do not match.")
      setIsPending(false)
      return
    }

    try {
      const result = isSignup
        ? await signUp.email({
            name,
            email,
            password: submittedPassword,
          })
        : await signIn.email({
            email,
            password: submittedPassword,
          })

      if (result.error) {
        setError(result.error.message ?? "Something went wrong.")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Unable to continue. Please try again.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        {isSignup ? (
          <Field>
            <FieldLabel htmlFor="name">Full name</FieldLabel>
            <Input id="name" name="name" placeholder="Alex Johnson" required />
            <FieldDescription>
              Use the name you want displayed on your profile.
            </FieldDescription>
          </Field>
        ) : null}

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            required
          />
        </Field>

        <Field data-invalid={passwordMismatch || undefined}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={passwordMismatch || undefined}
            required
          />
          {isSignup ? (
            <FieldDescription>
              Use at least 8 characters for a stronger account password.
            </FieldDescription>
          ) : null}
        </Field>

        {isSignup ? (
          <Field data-invalid={passwordMismatch || undefined}>
            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              aria-invalid={passwordMismatch || undefined}
              required
            />
          </Field>
        ) : null}
      </FieldGroup>

      {error ? <FieldError>{error}</FieldError> : null}

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[var(--amber)] text-[var(--amber-foreground)] hover:bg-[var(--amber)]/80"
        >
          {isPending && <Spinner className="mr-2" />}
          {submitLabel}
        </Button>

        {hasSocialAuth ? (
          <>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <p className="text-xs text-muted-foreground">or continue with</p>
              <Separator className="flex-1" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {googleEnabled ? (
                <Button
                  disabled={isPending}
                  onClick={() => void handleSocialSignIn("google")}
                  type="button"
                  variant="outline"
                >
                  {isPending && <Spinner className="mr-2" />}
                  Continue with Google
                </Button>
              ) : null}
              {githubEnabled ? (
                <Button
                  disabled={isPending}
                  onClick={() => void handleSocialSignIn("github")}
                  type="button"
                  variant="outline"
                >
                  {isPending && <Spinner className="mr-2" />}
                  Continue with GitHub
                </Button>
              ) : null}
            </div>
          </>
        ) : null}

        <p className="text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account?" : "Don’t have an account?"}{" "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {isSignup ? "Sign in" : "Create one"}
          </Link>
        </p>
      </div>
    </form>
  )
}
