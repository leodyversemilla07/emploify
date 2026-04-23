import {
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common"
import type { Request as ExpressRequest } from "express"

import { auth } from "../lib/auth.js"
import {
  getSessionFromRequest,
  requireAdminSession,
  requireSession,
} from "./auth-session.js"

jest.mock("../lib/auth.js", () => ({
  auth: {
    handler: jest.fn(),
  },
}))

describe("auth-session", () => {
  const mockedHandler = jest.mocked(auth.handler)
  const originalEnv = process.env.ADMIN_EMAILS

  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.ADMIN_EMAILS
  })

  afterAll(() => {
    process.env.ADMIN_EMAILS = originalEnv
  })

  it("getSessionFromRequest returns null for 401 responses", async () => {
    mockedHandler.mockResolvedValueOnce(new Response(null, { status: 401 }))

    await expect(
      getSessionFromRequest({ headers: {} } as ExpressRequest)
    ).resolves.toBeNull()
  })

  it("getSessionFromRequest throws for non-401 auth failures", async () => {
    mockedHandler.mockResolvedValueOnce(new Response("boom", { status: 500 }))

    await expect(
      getSessionFromRequest({ headers: {} } as ExpressRequest)
    ).rejects.toBeInstanceOf(InternalServerErrorException)
  })

  it("requireSession throws when no authenticated user is returned", async () => {
    mockedHandler.mockResolvedValueOnce(
      new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    )

    await expect(
      requireSession({ headers: {} } as ExpressRequest)
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it("requireAdminSession rejects authenticated non-admin users", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com"
    mockedHandler.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ user: { id: "user-1", email: "member@example.com" } }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      )
    )

    await expect(
      requireAdminSession({ headers: { cookie: "session=1" } } as ExpressRequest)
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it("requireAdminSession accepts configured admin emails", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com"
    mockedHandler.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ user: { id: "admin-1", email: "admin@example.com" } }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      )
    )

    await expect(
      requireAdminSession({ headers: { cookie: "session=1" } } as ExpressRequest)
    ).resolves.toMatchObject({
      user: { email: "admin@example.com" },
    })
  })
})
