import { Injectable } from "@nestjs/common"
import type { ExperienceLevel, Prisma } from "@prisma/client"

// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { PrismaService } from "../prisma/prisma.service.js"
// biome-ignore lint/style/useImportType: NestJS dependency injection requires runtime class references.
import { AshbyProvider } from "./ashby.provider.js"
// biome-ignore lint/style/useImportType: NestJS dependency injection requires runtime class references.
import { GreenhouseProvider } from "./greenhouse.provider.js"
import type { ExternalJob } from "./job.types.js"
// biome-ignore lint/style/useImportType: NestJS dependency injection requires runtime class references.
import { LeverProvider } from "./lever.provider.js"

const seedJobs: ExternalJob[] = [
  {
    title: "Junior Frontend Developer",
    company: "Orbit Labs",
    location: "Manila, Philippines",
    description:
      "Build polished product interfaces with React, TypeScript, and design systems.",
    source: "Greenhouse",
    remote: true,
    experienceLevel: "JUNIOR",
    postedAt: new Date("2026-04-01"),
  },
  {
    title: "Full Stack Engineer",
    company: "Northstar Cloud",
    location: "Singapore",
    description:
      "Own product features across Next.js, NestJS, and PostgreSQL services.",
    source: "Lever",
    remote: false,
    experienceLevel: "MID",
    postedAt: new Date("2026-04-03"),
  },
  {
    title: "Software Engineer Intern",
    company: "Ashby Systems",
    location: "Remote",
    description:
      "Work closely with product engineers on internal tools and job ingestion workflows.",
    source: "Ashby",
    remote: true,
    experienceLevel: "INTERN",
    postedAt: new Date("2026-04-05"),
  },
  {
    title: "Backend Engineer",
    company: "Signal Forge",
    location: "Cebu, Philippines",
    description:
      "Design APIs, data pipelines, and scalable background workers for recruiting products.",
    source: "Greenhouse",
    remote: false,
    experienceLevel: "MID",
    postedAt: new Date("2026-04-04"),
  },
  {
    title: "Senior Product Engineer",
    company: "Remote Grid",
    location: "Remote",
    description:
      "Lead feature architecture and mentor a product squad working on AI-assisted workflows.",
    source: "Lever",
    remote: true,
    experienceLevel: "SENIOR",
    postedAt: new Date("2026-04-02"),
  },
]

type ProviderSyncResult = {
  source: string
  status: "SUCCESS" | "SKIPPED" | "FAILED"
  imported: number
  message: string
  jobs: ExternalJob[]
}

@Injectable()
export class JobService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly greenhouseProvider: GreenhouseProvider,
    private readonly leverProvider: LeverProvider,
    private readonly ashbyProvider: AshbyProvider
  ) {}

  private async upsertExternalJob(job: ExternalJob) {
    const existing = await this.prisma.job.findFirst({
      where: {
        title: job.title,
        company: job.company,
        source: job.source,
      },
    })

    const data: Prisma.JobUncheckedCreateInput = {
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      source: job.source,
      remote: job.remote,
      experienceLevel: job.experienceLevel,
      postedAt: job.postedAt,
    }

    if (existing) {
      await this.prisma.job.update({
        where: { id: existing.id },
        data,
      })
      return existing.id
    }

    const created = await this.prisma.job.create({ data })
    return created.id
  }

  private async ensureSeedJobs() {
    const count = await this.prisma.job.count()

    if (count > 0) return

    await Promise.all(seedJobs.map((job) => this.upsertExternalJob(job)))
  }

  private buildDetails(summary: string, providerResults: ProviderSyncResult[]) {
    return JSON.stringify({
      summary,
      providers: providerResults.map(({ jobs, ...result }) => result),
    })
  }

  async getSyncStatus() {
    const latest = await this.prisma.jobSyncRun.findFirst({
      orderBy: { startedAt: "desc" },
    })

    return {
      lastRun: latest,
    }
  }

  async syncJobs() {
    const syncRun = await this.prisma.jobSyncRun.create({
      data: {
        status: "RUNNING",
        imported: 0,
        sources: "",
      },
    })

    const providerEntries = [
      { name: "Greenhouse", run: () => this.greenhouseProvider.fetchJobs() },
      { name: "Lever", run: () => this.leverProvider.fetchJobs() },
      { name: "Ashby", run: () => this.ashbyProvider.fetchJobs() },
    ]

    const providerResults: ProviderSyncResult[] = await Promise.all(
      providerEntries.map(async (entry) => {
        try {
          const jobs = await entry.run()
          return {
            source: entry.name,
            status: jobs.length > 0 ? "SUCCESS" : "SKIPPED",
            imported: jobs.length,
            message:
              jobs.length > 0
                ? `Fetched ${jobs.length} roles.`
                : "No jobs fetched or provider not configured.",
            jobs,
          }
        } catch (error) {
          return {
            source: entry.name,
            status: "FAILED",
            imported: 0,
            message:
              error instanceof Error ? error.message : "Unknown provider error",
            jobs: [],
          }
        }
      })
    )

    const jobs = providerResults.flatMap((result) => result.jobs)

    if (jobs.length === 0) {
      await this.ensureSeedJobs()
      const updated = await this.prisma.jobSyncRun.update({
        where: { id: syncRun.id },
        data: {
          status: providerResults.some((result) => result.status === "FAILED")
            ? "PARTIAL"
            : "SUCCESS",
          imported: seedJobs.length,
          sources: "seed",
          details: this.buildDetails(
            "No live provider jobs were imported. Seed jobs were ensured.",
            providerResults
          ),
          completedAt: new Date(),
        },
      })

      return {
        imported: seedJobs.length,
        sources: ["seed"],
        providerResults: providerResults.map(
          ({ jobs: _jobs, ...result }) => result
        ),
        lastRun: updated,
      }
    }

    for (const job of jobs) {
      await this.upsertExternalJob(job)
    }

    const sources = [...new Set(jobs.map((job) => job.source))]
    const updated = await this.prisma.jobSyncRun.update({
      where: { id: syncRun.id },
      data: {
        status: providerResults.some((result) => result.status === "FAILED")
          ? "PARTIAL"
          : "SUCCESS",
        imported: jobs.length,
        sources: sources.join(", "),
        details: this.buildDetails(
          `Imported roles from ${sources.join(", ")}.`,
          providerResults
        ),
        completedAt: new Date(),
      },
    })

    return {
      imported: jobs.length,
      sources,
      providerResults: providerResults.map(
        ({ jobs: _jobs, ...result }) => result
      ),
      lastRun: updated,
    }
  }

  async listJobs(filters: {
    email?: string
    search?: string
    location?: string
    source?: string
    remote?: boolean
    experienceLevel?: ExperienceLevel
  }) {
    await this.ensureSeedJobs()

    const jobs = await this.prisma.job.findMany({
      where: {
        ...(filters.search
          ? {
              OR: [
                { title: { contains: filters.search } },
                { company: { contains: filters.search } },
                { description: { contains: filters.search } },
              ],
            }
          : {}),
        ...(filters.location
          ? { location: { contains: filters.location } }
          : {}),
        ...(filters.source ? { source: { contains: filters.source } } : {}),
        ...(typeof filters.remote === "boolean"
          ? { remote: filters.remote }
          : {}),
        ...(filters.experienceLevel
          ? { experienceLevel: filters.experienceLevel }
          : {}),
      },
      orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
    })

    if (!filters.email) {
      return jobs.map((job) => ({ ...job, saved: false }))
    }

    const savedJobs = await this.prisma.savedJob.findMany({
      where: {
        user: { email: filters.email },
      },
      select: { jobId: true },
    })

    const savedSet = new Set(savedJobs.map((item) => item.jobId))

    return jobs.map((job) => ({
      ...job,
      saved: savedSet.has(job.id),
    }))
  }

  async saveJob(input: { email: string; jobId: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    })

    if (!user) {
      throw new Error("User not found")
    }

    const savedJob = await this.prisma.savedJob.upsert({
      where: {
        userId_jobId: {
          userId: user.id,
          jobId: input.jobId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        jobId: input.jobId,
      },
    })

    await this.prisma.application.upsert({
      where: {
        id: `${user.id}:${input.jobId}`,
      },
      update: {
        status: "SAVED",
      },
      create: {
        id: `${user.id}:${input.jobId}`,
        userId: user.id,
        jobId: input.jobId,
        status: "SAVED",
      },
    })

    return savedJob
  }
}
