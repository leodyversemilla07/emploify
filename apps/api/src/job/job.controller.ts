import { Body, Controller, Get, Post, Query } from "@nestjs/common"
import type { ExperienceLevel } from "../generated/prisma/client.js"

// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { JobService } from "./job.service.js"

@Controller("jobs")
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  async listJobs(
    @Query("email") email?: string,
    @Query("search") search?: string,
    @Query("location") location?: string,
    @Query("source") source?: string,
    @Query("remote") remote?: string,
    @Query("experienceLevel") experienceLevel?: ExperienceLevel
  ) {
    return this.jobService.listJobs({
      email,
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
  async syncJobs() {
    return this.jobService.syncJobs()
  }

  @Post("save")
  async saveJob(@Body() body: { email: string; jobId: string }) {
    return this.jobService.saveJob(body)
  }
}
