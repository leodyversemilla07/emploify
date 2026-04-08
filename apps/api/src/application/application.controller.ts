import { Body, Controller, Get, Put, Query } from "@nestjs/common"
import type { ApplicationStatus } from "@prisma/client"

// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { ApplicationService } from "./application.service.js"

@Controller("applications")
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Get()
  async listApplications(@Query("email") email?: string) {
    if (!email) {
      return []
    }

    return this.applicationService.listApplications(email)
  }

  @Get("analytics")
  async getAnalytics(@Query("email") email?: string) {
    if (!email) {
      return {
        totalApplications: 0,
        saved: 0,
        applied: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
        interviewRate: 0,
        offerRate: 0,
      }
    }

    return this.applicationService.getAnalytics(email)
  }

  @Put("notes")
  async updateNotes(
    @Body() body: { email: string; applicationId: string; notes: string }
  ) {
    return this.applicationService.updateNotes(body)
  }

  @Put("status")
  async updateStatus(
    @Body() body: {
      email: string
      applicationId: string
      status: ApplicationStatus
    }
  ) {
    return this.applicationService.updateStatus(body)
  }
}
