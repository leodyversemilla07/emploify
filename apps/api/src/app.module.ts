import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"

import { AiModule } from "./ai/ai.module.js"
import { ApplicationModule } from "./application/application.module.js"
import { AuthController } from "./auth/auth.controller.js"
import { JobModule } from "./job/job.module.js"
import { PrismaModule } from "./prisma/prisma.module.js"
import { UserModule } from "./user/user.module.js"

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UserModule,
    JobModule,
    ApplicationModule,
    AiModule,
  ],
  controllers: [AuthController],
  providers: [],
})
export class AppModule {}
