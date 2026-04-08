import { AuthShell } from "@/components/auth/auth-shell"
import { EmailAuthForm } from "@/components/auth/email-auth-form"

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Start tracking applications, matching jobs, and organizing your search."
    >
      <EmailAuthForm mode="signup" />
    </AuthShell>
  )
}
