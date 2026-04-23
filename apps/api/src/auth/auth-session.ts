import {
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common"
import type { Request as ExpressRequest } from "express"

import { auth } from "../lib/auth.js"

type SessionUser = {
  id: string
  email: string
  name?: string | null
  image?: string | null
}

type AuthSession = {
  session?: {
    id: string
    expiresAt: string | Date
  } | null
  user?: SessionUser | null
} | null

type AuthenticatedSession = {
  session?: {
    id: string
    expiresAt: string | Date
  } | null
  user: SessionUser
}

function getBaseURL() {
  return process.env.BETTER_AUTH_URL ?? `http://localhost:${process.env.PORT ?? 4000}`
}

function createHeaders(req: ExpressRequest) {
  const headers = new Headers()

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      headers.set(key, value.join(", "))
      continue
    }

    if (typeof value === "string") {
      headers.set(key, value)
    }
  }

  return headers
}

export async function getSessionFromRequest(
  req: ExpressRequest
): Promise<AuthSession> {
  const response = await auth.handler(
    new Request(new URL("/api/auth/get-session", getBaseURL()), {
      method: "GET",
      headers: createHeaders(req),
    })
  )

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new InternalServerErrorException(
      `Failed to resolve auth session (status ${response.status})`
    )
  }

  return (await response.json()) as AuthSession
}

export async function requireSession(
  req: ExpressRequest
): Promise<AuthenticatedSession> {
  const session = await getSessionFromRequest(req)

  if (!session?.user?.email) {
    throw new UnauthorizedException("Authentication required")
  }

  return session as AuthenticatedSession
}

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export async function requireAdminSession(
  req: ExpressRequest
): Promise<AuthenticatedSession> {
  const session = await requireSession(req)
  const adminEmails = getAdminEmails()

  if (adminEmails.length === 0) {
    throw new ForbiddenException(
      "Admin access is not configured. Set ADMIN_EMAILS in the API environment."
    )
  }

  if (!adminEmails.includes(session.user.email.toLowerCase())) {
    throw new ForbiddenException("Admin access required")
  }

  return session
}
