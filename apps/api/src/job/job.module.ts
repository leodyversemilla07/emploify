import { Module } from "@nestjs/common"

import { AshbyProvider } from "./ashby.provider.js"
import { GreenhouseProvider } from "./greenhouse.provider.js"
import { JobController } from "./job.controller.js"
import { JobService } from "./job.service.js"
import { LeverProvider } from "./lever.provider.js"
import { JobSyncSchedulerService } from "./sync-scheduler.service.js"

@Module({
  controllers: [JobController],
  providers: [
    JobService,
    GreenhouseProvider,
    LeverProvider,
    AshbyProvider,
    JobSyncSchedulerService,
  ],
  exports: [JobService],
})
export class JobModule {}
