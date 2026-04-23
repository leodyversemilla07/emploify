import { Body, Controller, Get, Put, Req } from "@nestjs/common"
import type { ApplicationStatus } from "@prisma/client"
import type { Request as ExpressRequest } from "express"

import { requireSession } from "../auth/auth-session.js"
// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { ApplicationService } from "./application.service.js"

@Controller("applications")
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Get()
  async listApplications(@Req() req: ExpressRequest) {
    const session = await requireSession(req)
    return this.applicationService.listApplications(session.user.email)
  }

  @Get("analytics")
  async getAnalytics(@Req() req: ExpressRequest) {
    const session = await requireSession(req)
    return this.applicationService.getAnalytics(session.user.email)
  }

  @Put("notes")
  async updateNotes(
    @Req() req: ExpressRequest,
    @Body() body: { applicationId: string; notes: string }
  ) {
    const session = await requireSession(req)

    return this.applicationService.updateNotes({
      email: session.user.email,
      ...body,
    })
  }

  @Put("status")
  async updateStatus(
    @Req() req: ExpressRequest,
    @Body() body: {
      applicationId: string
      status: ApplicationStatus
    }
  ) {
    const session = await requireSession(req)

    return this.applicationService.updateStatus({
      email: session.user.email,
      ...body,
    })
  }
}
