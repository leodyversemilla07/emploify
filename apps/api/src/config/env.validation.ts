type Env = Record<string, string | undefined>

function requireEnv(env: Env, key: string) {
  const value = env[key]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

function requireUrl(env: Env, key: string) {
  const value = requireEnv(env, key)

  try {
    new URL(value)
  } catch {
    throw new Error(`Environment variable ${key} must be a valid URL`)
  }

  return value
}

function validateAdminEmails(value: string | undefined) {
  if (!value?.trim()) {
    return
  }

  const emails = value
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  for (const email of emails) {
    if (!emailPattern.test(email)) {
      throw new Error(`ADMIN_EMAILS contains an invalid email: ${email}`)
    }
  }
}

export function validateEnv(config: Record<string, unknown>) {
  const env = config as Env

  requireEnv(env, "DATABASE_URL")
  requireUrl(env, "BETTER_AUTH_URL")
  requireUrl(env, "FRONTEND_URL")

  const betterAuthSecret = requireEnv(env, "BETTER_AUTH_SECRET")
  if (betterAuthSecret.length < 16) {
    throw new Error("BETTER_AUTH_SECRET must be at least 16 characters long")
  }

  validateAdminEmails(env.ADMIN_EMAILS)

  return config
}
