import { Injectable, NotFoundException } from "@nestjs/common"
import type { ExperienceLevel } from "@prisma/client"

import type { ResumeParseResult } from "../ai/ai.service.js"

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
      throw new NotFoundException("User not found")
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

  async updateResumeProfile(input: {
    email: string
    resumeUrl: string
    parsed?: ResumeParseResult | null
  }) {
    return this.upsertProfile({
      email: input.email,
      resumeUrl: input.resumeUrl,
      location: input.parsed?.location ?? undefined,
      skills: input.parsed?.skills?.length
        ? input.parsed.skills.join(", ")
        : undefined,
      experienceLevel: input.parsed?.experienceLevel ?? undefined,
    })
  }
}
