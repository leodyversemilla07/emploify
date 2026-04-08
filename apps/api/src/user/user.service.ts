import { Injectable } from "@nestjs/common"
import type { ExperienceLevel } from "@prisma/client"

// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { PrismaService } from "../prisma/prisma.service.js"

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfileByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        applications: true,
        savedJobs: true,
      },
    })
  }

  async upsertProfile(input: {
    email: string
    name?: string
    location?: string
    skills?: string
    experienceLevel?: ExperienceLevel | null
    resumeUrl?: string
  }) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    })

    if (!user) {
      throw new Error("User not found")
    }

    if (input.name && input.name !== user.name) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { name: input.name },
      })
    }

    return this.prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        location: input.location,
        skills: input.skills,
        experienceLevel: input.experienceLevel,
        resumeUrl: input.resumeUrl,
      },
      create: {
        userId: user.id,
        location: input.location,
        skills: input.skills,
        experienceLevel: input.experienceLevel,
        resumeUrl: input.resumeUrl,
      },
    })
  }
}
