import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common"
import type { ExperienceLevel } from "@prisma/client"

import { AuthGuard } from "../auth/auth.guard.js"
import { CurrentUser } from "../auth/current-user.decorator.js"
import type { SessionUser } from "../auth/auth.types.js"
// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { UserService } from "./user.service.js"

@Controller("users")
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("profile")
  async getProfile(@CurrentUser() currentUser: SessionUser) {
    const user = await this.userService.getProfileByEmail(currentUser.email)

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
    @CurrentUser() currentUser: SessionUser,
    @Body()
    body: {
      name?: string
      location?: string
      skills?: string
      experienceLevel?: ExperienceLevel | null
      resumeUrl?: string
    }
  ) {
    return this.userService.upsertProfile({
      email: currentUser.email,
      ...body,
    })
  }
}
