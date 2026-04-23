"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(
  /\/$/,
  ""
)

type SessionUser = {
  id: string
  email: string
  name?: string | null
  image?: string | null
}

type SessionData = {
  session?: {
    id: string
    expiresAt: string
  } | null
  user?: SessionUser | null
} | null

type AuthResult = {
  data?: unknown
  error?: {
    message?: string
  }
}

type AuthContextValue = {
  data: SessionData
  error: Error | null
  isPending: boolean
  refreshSession: () => Promise<SessionData>
  setSession: (session: SessionData) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function parseAuthResponse(response: Response): Promise<AuthResult> {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    return (await response.json()) as AuthResult
  }

  return response.ok
    ? { data: await response.text() }
    : { error: { message: await response.text() } }
}

async function authFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers)

  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json")
  }

  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  })
}

async function getSessionRequest(): Promise<SessionData> {
  const response = await authFetch("/api/auth/get-session", {
    method: "GET",
  })

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to resolve session (${response.status})`)
  }

  const session = (await response.json()) as SessionData
  return session?.user ? session : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SessionData>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isPending, setIsPending] = useState(true)

  const refreshSession = useCallback(async () => {
    setIsPending(true)
    setError(null)

    try {
      const session = await getSessionRequest()
      setData(session)
      return session
    } catch (error) {
      const resolvedError =
        error instanceof Error ? error : new Error("Failed to refresh session")
      setData(null)
      setError(resolvedError)
      return null
    } finally {
      setIsPending(false)
    }
  }, [])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      data,
      error,
      isPending,
      refreshSession,
      setSession: setData,
    }),
    [data, error, isPending, refreshSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useSession() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useSession must be used within AuthProvider")
  }

  return {
    data: context.data,
    error: context.error,
    isPending: context.isPending,
    refresh: context.refreshSession,
  }
}

function useAuthContext() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("Auth helpers must be used within AuthProvider")
  }

  return context
}

export function useAuthActions() {
  const { refreshSession, setSession } = useAuthContext()

  const signInEmail = useCallback(
    async (input: { email: string; password: string }) => {
      const response = await authFetch("/api/auth/sign-in/email", {
        method: "POST",
        body: JSON.stringify(input),
      })
      const result = await parseAuthResponse(response)

      if (!response.ok || result.error) {
        return result
      }

      await refreshSession()
      return result
    },
    [refreshSession]
  )

  const signUpEmail = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const response = await authFetch("/api/auth/sign-up/email", {
        method: "POST",
        body: JSON.stringify(input),
      })
      const result = await parseAuthResponse(response)

      if (!response.ok || result.error) {
        return result
      }

      await refreshSession()
      return result
    },
    [refreshSession]
  )

  const signOut = useCallback(async () => {
    const response = await authFetch("/api/auth/sign-out", {
      method: "POST",
    })
    const result = await parseAuthResponse(response)

    if (!response.ok || result.error) {
      return result
    }

    setSession(null)
    return result
  }, [setSession])

  const signInSocial = useCallback(
    async (input: { provider: "google" | "github"; callbackURL: string }) => {
      const callbackURL = new URL(input.callbackURL, window.location.origin)
      window.location.href = `${API_URL}/api/auth/sign-in/social?provider=${encodeURIComponent(input.provider)}&callbackURL=${encodeURIComponent(callbackURL.toString())}`
      return { data: null } as AuthResult
    },
    []
  )

  return {
    signIn: {
      email: signInEmail,
      social: signInSocial,
    },
    signUp: {
      email: signUpEmail,
    },
    signOut,
  }
}
