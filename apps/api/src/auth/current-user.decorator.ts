import { createParamDecorator, type ExecutionContext } from "@nestjs/common"

import type { AuthenticatedRequest, SessionUser } from "./auth.types.js"

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser | null => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>()
    return request.authSession?.user ?? null
  }
)
