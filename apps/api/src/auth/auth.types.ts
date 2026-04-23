import type { Request as ExpressRequest } from "express"

export type SessionUser = {
  id: string
  email: string
  name?: string | null
  image?: string | null
}

export type AuthSession = {
  session?: {
    id: string
    expiresAt: string | Date
  } | null
  user?: SessionUser | null
} | null

export type AuthenticatedSession = {
  session?: {
    id: string
    expiresAt: string | Date
  } | null
  user: SessionUser
}

export type AuthenticatedRequest = ExpressRequest & {
  authSession?: AuthSession
}
