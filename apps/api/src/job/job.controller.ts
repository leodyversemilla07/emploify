import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common"
import type { ExperienceLevel } from "@prisma/client"
import type { Request as ExpressRequest } from "express"

import {
  getSessionFromRequest,
  requireAdminSession,
  requireSession,
} from "../auth/auth-session.js"
// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { JobService } from "./job.service.js"

@Controller("jobs")
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  async listJobs(
    @Req() req: ExpressRequest,
    @Query("search") search?: string,
    @Query("location") location?: string,
    @Query("source") source?: string,
    @Query("remote") remote?: string,
    @Query("experienceLevel") experienceLevel?: ExperienceLevel
  ) {
    const hasAuthCookies = Boolean(req.headers.cookie?.trim())
    const session = hasAuthCookies ? await getSessionFromRequest(req) : null

    return this.jobService.listJobs({
      email: session?.user?.email,
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
  async syncJobs(@Req() req: ExpressRequest) {
    await requireAdminSession(req)
    return this.jobService.syncJobs()
  }

  @Post("save")
  async saveJob(
    @Req() req: ExpressRequest,
    @Body() body: { jobId: string }
  ) {
    const session = await requireSession(req)

    return this.jobService.saveJob({
      email: session.user.email,
      ...body,
    })
  }
}
