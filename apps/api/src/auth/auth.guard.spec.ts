import type { ExecutionContext } from "@nestjs/common"

import { AdminGuard, AuthGuard, OptionalAuthGuard } from "./auth.guard.js"
import * as authSession from "./auth-session.js"
import type { AuthenticatedRequest, AuthenticatedSession } from "./auth.types.js"

jest.mock("./auth-session.js", () => ({
  getSessionFromRequest: jest.fn(),
  requireAdminSession: jest.fn(),
  requireSession: jest.fn(),
}))

function createExecutionContext(request: AuthenticatedRequest) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext
}

describe("auth guards", () => {
  const mockedRequireSession = jest.mocked(authSession.requireSession)
  const mockedGetSessionFromRequest = jest.mocked(authSession.getSessionFromRequest)
  const mockedRequireAdminSession = jest.mocked(authSession.requireAdminSession)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("AuthGuard stores the authenticated session on the request", async () => {
    const guard = new AuthGuard()
    const request = { headers: {} } as AuthenticatedRequest
    const session = {
      user: { id: "user-1", email: "user@example.com" },
    } as AuthenticatedSession

    mockedRequireSession.mockResolvedValueOnce(session)

    await expect(guard.canActivate(createExecutionContext(request))).resolves.toBe(true)
    expect(mockedRequireSession).toHaveBeenCalledWith(request)
    expect(request.authSession).toBe(session)
  })

  it("OptionalAuthGuard skips session lookup when no cookies are present", async () => {
    const guard = new OptionalAuthGuard()
    const request = { headers: {} } as AuthenticatedRequest

    await expect(guard.canActivate(createExecutionContext(request))).resolves.toBe(true)
    expect(mockedGetSessionFromRequest).not.toHaveBeenCalled()
    expect(request.authSession).toBeNull()
  })

  it("OptionalAuthGuard resolves the session when cookies are present", async () => {
    const guard = new OptionalAuthGuard()
    const request = {
      headers: { cookie: "session=abc" },
    } as AuthenticatedRequest
    const session = {
      user: { id: "user-2", email: "member@example.com" },
    } as AuthenticatedSession

    mockedGetSessionFromRequest.mockResolvedValueOnce(session)

    await expect(guard.canActivate(createExecutionContext(request))).resolves.toBe(true)
    expect(mockedGetSessionFromRequest).toHaveBeenCalledWith(request)
    expect(request.authSession).toBe(session)
  })

  it("AdminGuard stores the admin session on the request", async () => {
    const guard = new AdminGuard()
    const request = { headers: { cookie: "session=admin" } } as AuthenticatedRequest
    const session = {
      user: { id: "admin-1", email: "admin@example.com" },
    } as AuthenticatedSession

    mockedRequireAdminSession.mockResolvedValueOnce(session)

    await expect(guard.canActivate(createExecutionContext(request))).resolves.toBe(true)
    expect(mockedRequireAdminSession).toHaveBeenCalledWith(request)
    expect(request.authSession).toBe(session)
  })
})
