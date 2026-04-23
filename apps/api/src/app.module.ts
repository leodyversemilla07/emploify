import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"

import { AiModule } from "./ai/ai.module.js"
import { LlmModule } from "./llm/index.js"
import { ApplicationModule } from "./application/application.module.js"
import { AdminGuard, AuthGuard, OptionalAuthGuard } from "./auth/auth.guard.js"
import { AuthController } from "./auth/auth.controller.js"
import { HealthController } from "./health.controller.js"
import { JobModule } from "./job/job.module.js"
import { PrismaModule } from "./prisma/prisma.module.js"
import { UserModule } from "./user/user.module.js"

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LlmModule,
    PrismaModule,
    UserModule,
    JobModule,
    ApplicationModule,
    AiModule,
  ],
  controllers: [AuthController, HealthController],
  providers: [AuthGuard, OptionalAuthGuard, AdminGuard],
})
export class AppModule {}
