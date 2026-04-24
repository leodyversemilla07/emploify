import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common"

import { AdminGuard, AuthGuard, OptionalAuthGuard } from "../auth/auth.guard.js"
import { CurrentUser } from "../auth/current-user.decorator.js"
import type { SessionUser } from "../auth/auth.types.js"
// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { JobService } from "./job.service.js"
import { ListJobsDto } from "./dto/list-jobs.dto.js"
import { SaveJobDto } from "./dto/save-job.dto.js"

@Controller("jobs")
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  async listJobs(
    @CurrentUser() user: SessionUser | null,
    @Query() dto: ListJobsDto,
  ) {
    return this.jobService.listJobs({
      email: user?.email,
      search: dto.search,
      location: dto.location,
      source: dto.source,
      remote: dto.remote,
      experienceLevel: dto.experienceLevel,
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
