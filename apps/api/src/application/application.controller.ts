import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common"
import type { ApplicationStatus } from "@prisma/client"

import { AuthGuard } from "../auth/auth.guard.js"
import { CurrentUser } from "../auth/current-user.decorator.js"
import type { SessionUser } from "../auth/auth.types.js"
// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { ApplicationService } from "./application.service.js"

@Controller("applications")
@UseGuards(AuthGuard)
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Get()
  async listApplications(@CurrentUser() currentUser: SessionUser) {
    return this.applicationService.listApplications(currentUser.email)
  }

  @Get("analytics")
  async getAnalytics(@CurrentUser() currentUser: SessionUser) {
    return this.applicationService.getAnalytics(currentUser.email)
  }

  @Put("notes")
  async updateNotes(
    @CurrentUser() currentUser: SessionUser,
    @Body() body: { applicationId: string; notes: string }
  ) {
    return this.applicationService.updateNotes({
      email: currentUser.email,
      ...body,
    })
  }

  @Put("status")
  async updateStatus(
    @CurrentUser() currentUser: SessionUser,
    @Body() body: {
      applicationId: string
      status: ApplicationStatus
    }
  ) {
    return this.applicationService.updateStatus({
      email: currentUser.email,
      ...body,
    })
  }
}
