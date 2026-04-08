import { Body, Controller, Get, Put, Query } from "@nestjs/common"
import type { ExperienceLevel } from "@prisma/client"

// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { UserService } from "./user.service.js"

@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("profile")
  async getProfile(@Query("email") email?: string) {
    if (!email) {
      return { error: "Email is required" }
    }

    const user = await this.userService.getProfileByEmail(email)

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
    @Body()
    body: {
      email: string
      name?: string
      location?: string
      skills?: string
      experienceLevel?: ExperienceLevel | null
      resumeUrl?: string
    }
  ) {
    return this.userService.upsertProfile(body)
  }
}
