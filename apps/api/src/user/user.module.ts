import { Module } from "@nestjs/common"

import { AiModule } from "../ai/ai.module.js"
import { UserController } from "./user.controller.js"
import { UserService } from "./user.service.js"

@Module({
  imports: [AiModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
