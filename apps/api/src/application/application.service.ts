import { Injectable } from "@nestjs/common"
import {
  ApplicationStatus,
  type ApplicationStatus as ApplicationStatusType,
} from "@prisma/client"

// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { PrismaService } from "../prisma/prisma.service.js"

@Injectable()
export class ApplicationService {
  constructor(private readonly prisma: PrismaService) {}

  async listApplications(email: string) {
    return this.prisma.application.findMany({
      where: {
        user: { email },
      },
      include: {
        job: true,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    })
  }

  async getAnalytics(email: string) {
    const applications = await this.prisma.application.findMany({
      where: {
        user: { email },
      },
      select: {
        status: true,
      },
    })

    const totals = {
      totalApplications: applications.length,
      saved: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    }

    for (const application of applications) {
      switch (application.status) {
        case ApplicationStatus.SAVED:
          totals.saved += 1
          break
        case ApplicationStatus.APPLIED:
          totals.applied += 1
          break
        case ApplicationStatus.INTERVIEW:
          totals.interview += 1
          break
        case ApplicationStatus.OFFER:
          totals.offer += 1
          break
        case ApplicationStatus.REJECTED:
          totals.rejected += 1
          break
      }
    }

    const interviewRate =
      totals.totalApplications === 0
        ? 0
        : Math.round(
            ((totals.interview + totals.offer) / totals.totalApplications) * 100
          )

    const offerRate =
      totals.totalApplications === 0
        ? 0
        : Math.round((totals.offer / totals.totalApplications) * 100)

    return {
      ...totals,
      interviewRate,
      offerRate,
    }
  }

  async updateNotes(input: {
    email: string
    applicationId: string
    notes: string
  }) {
    const application = await this.prisma.application.findFirst({
      where: {
        id: input.applicationId,
        user: { email: input.email },
      },
    })

    if (!application) {
      throw new Error("Application not found")
    }

    return this.prisma.application.update({
      where: { id: input.applicationId },
      data: {
        notes: input.notes.trim() || null,
      },
      include: {
        job: true,
      },
    })
  }

  async updateStatus(input: {
    email: string
    applicationId: string
    status: ApplicationStatusType
  }) {
    const application = await this.prisma.application.findFirst({
      where: {
        id: input.applicationId,
        user: { email: input.email },
      },
    })

    if (!application) {
      throw new Error("Application not found")
    }

    return this.prisma.application.update({
      where: { id: input.applicationId },
      data: {
        status: input.status,
      },
      include: {
        job: true,
      },
    })
  }
}
