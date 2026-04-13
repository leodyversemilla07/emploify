import { createAuthClient } from "better-auth/react"

const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
})

export const useSession: typeof authClient.useSession = authClient.useSession
export const signIn: typeof authClient.signIn = authClient.signIn
export const signOut: typeof authClient.signOut = authClient.signOut
export const signUp: typeof authClient.signUp = authClient.signUp
