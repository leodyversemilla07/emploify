import { Body, Controller, Get, Put, Req } from "@nestjs/common"
import type { ExperienceLevel } from "@prisma/client"
import type { Request as ExpressRequest } from "express"

import { requireSession } from "../auth/auth-session.js"
// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { UserService } from "./user.service.js"

@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("profile")
  async getProfile(@Req() req: ExpressRequest) {
    const session = await requireSession(req)
    const user = await this.userService.getProfileByEmail(session.user.email)

    if (!user) {
      return { error: "User not found" }
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      profile: user.profile,
      metrics: {
        savedJobs: user.savedJobs.length,
        applications: user.applications.length,
      },
    }
  }

  @Put("profile")
  async upsertProfile(
    @Req() req: ExpressRequest,
    @Body()
    body: {
      name?: string
      location?: string
      skills?: string
      experienceLevel?: ExperienceLevel | null
      resumeUrl?: string
    }
  ) {
    const session = await requireSession(req)

    return this.userService.upsertProfile({
      email: session.user.email,
      ...body,
    })
  }
}
