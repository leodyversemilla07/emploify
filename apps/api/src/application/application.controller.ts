import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common"

import { AuthGuard } from "../auth/auth.guard.js"
import { CurrentUser } from "../auth/current-user.decorator.js"
import type { SessionUser } from "../auth/auth.types.js"
// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { ApplicationService } from "./application.service.js"
import { UpdateApplicationNotesDto } from "./dto/update-application-notes.dto.js"
import { UpdateApplicationStatusDto } from "./dto/update-application-status.dto.js"

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
    @Body() body: UpdateApplicationNotesDto
  ) {
    return this.applicationService.updateNotes({
      ...body,
      email: currentUser.email,
    })
  }

  @Put("status")
  async updateStatus(
    @CurrentUser() currentUser: SessionUser,
    @Body() body: UpdateApplicationStatusDto
  ) {
    return this.applicationService.updateStatus({
      ...body,
      email: currentUser.email,
    })
  }
}
