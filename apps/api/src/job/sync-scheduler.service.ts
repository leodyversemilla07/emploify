import { Injectable } from "@nestjs/common"
import { Logger } from "@nestjs/common"
import type { OnModuleInit } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"

// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { JobService } from "./job.service.js"

@Injectable()
export class JobSyncSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(JobSyncSchedulerService.name)

  constructor(private readonly jobService: JobService) {}

  onModuleInit() {
    // Optionally log if scheduling is enabled based on env
    const enabled = process.env.JOB_SYNC_ENABLED === "true"
    if (enabled) {
      this.logger.log(
        `Background job sync enabled (interval: ${process.env.JOB_SYNC_INTERVAL_MINUTES ?? "60"} minutes)`
      )
    } else {
      this.logger.log(
        "Background job sync is disabled. Set JOB_SYNC_ENABLED=true to enable."
      )
    }
  }

  @Cron(
    process.env.JOB_SYNC_INTERVAL_MINUTES
      ? `${process.env.JOB_SYNC_INTERVAL_MINUTES} * * * *`
      : CronExpression.EVERY_HOUR
  )
  async handleSync() {
    const enabled = process.env.JOB_SYNC_ENABLED === "true"
    if (!enabled) {
      this.logger.debug("Sync skipped: JOB_SYNC_ENABLED is not true")
      return
    }

    this.logger.log("Running scheduled job sync...")
    try {
      const result = await this.jobService.syncJobs()
      this.logger.log(
        `Scheduled sync completed: imported=${result.imported} sources=${result.sources.join(
          ", "
        )}`
      )
    } catch (error) {
      this.logger.error(
        `Scheduled job sync failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }
}
