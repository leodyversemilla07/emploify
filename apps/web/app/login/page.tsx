import { AuthShell } from "@/components/auth/auth-shell"
import { EmailAuthForm } from "@/components/auth/email-auth-form"

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      description="Access your job search workspace and continue where you left off."
    >
      <EmailAuthForm mode="login" />
    </AuthShell>
  )
}
