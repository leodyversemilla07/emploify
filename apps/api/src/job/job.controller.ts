import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common"
import type { ExperienceLevel } from "@prisma/client"

import { AdminGuard, AuthGuard, OptionalAuthGuard } from "../auth/auth.guard.js"
import { CurrentUser } from "../auth/current-user.decorator.js"
import type { SessionUser } from "../auth/auth.types.js"
// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { JobService } from "./job.service.js"
import { SaveJobDto } from "./dto/save-job.dto.js"

@Controller("jobs")
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  async listJobs(
    @CurrentUser() user: SessionUser | null,
    @Query("search") search?: string,
    @Query("location") location?: string,
    @Query("source") source?: string,
    @Query("remote") remote?: string,
    @Query("experienceLevel") experienceLevel?: ExperienceLevel
  ) {
    return this.jobService.listJobs({
      email: user?.email,
      search,
      location,
      source,
      remote: remote === undefined ? undefined : remote === "true",
      experienceLevel,
    })
  }

  @Get("sync/status")
  async getSyncStatus() {
    return this.jobService.getSyncStatus()
  }

  @Post("sync")
  @UseGuards(AdminGuard)
  async syncJobs() {
    return this.jobService.syncJobs()
  }

  @Post("save")
  @UseGuards(AuthGuard)
  async saveJob(
    @CurrentUser() user: SessionUser,
    @Body() body: SaveJobDto
  ) {
    return this.jobService.saveJob({
      ...body,
      email: user.email,
    })
  }
}
