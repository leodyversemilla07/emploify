import {
  CanActivate,
  Injectable,
  type ExecutionContext,
} from "@nestjs/common"

import {
  getSessionFromRequest,
  requireAdminSession,
  requireSession,
} from "./auth-session.js"
import type {
  AuthenticatedRequest,
  AuthenticatedSession,
} from "./auth.types.js"

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const session = await requireSession(request)
    request.authSession = session
    return true
  }
}

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const hasAuthCookies = Boolean(request.headers.cookie?.trim())

    request.authSession = hasAuthCookies
      ? await getSessionFromRequest(request)
      : null

    return true
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const session = (await requireAdminSession(request)) as AuthenticatedSession
    request.authSession = session
    return true
  }
}
