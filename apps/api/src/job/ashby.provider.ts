import { Injectable } from "@nestjs/common"

import type { ExperienceLevel } from "@prisma/client"
import type { ExternalJob } from "./job.types.js"

@Injectable()
export class AshbyProvider {
  private inferExperienceLevel(text: string): ExperienceLevel | null {
    const haystack = text.toLowerCase()

    if (haystack.includes("intern")) return "INTERN"
    if (haystack.includes("junior")) return "JUNIOR"
    if (haystack.includes("senior")) return "SENIOR"
    if (haystack.includes("mid")) return "MID"

    return null
  }

  async fetchJobs(): Promise<ExternalJob[]> {
    const sourceUrl = process.env.ASHBY_JOBS_URL

    if (!sourceUrl) return []

    const res = await fetch(sourceUrl)

    if (!res.ok) return []

    const data = (await res.json()) as {
      jobs?: Array<{
        title?: string
        location?: string
        description?: string
        updatedAt?: string
      }>
    }

    return (data.jobs ?? []).flatMap((job) => {
      if (!job.title) return []

      const description = job.description ?? job.title
      const location = job.location ?? null

      return {
        title: job.title,
        company: process.env.ASHBY_COMPANY_NAME ?? "Ashby Company",
        location,
        description,
        source: "Ashby",
        remote: (location ?? "").toLowerCase().includes("remote"),
        experienceLevel: this.inferExperienceLevel(
          `${job.title} ${description}`
        ),
        postedAt: job.updatedAt ? new Date(job.updatedAt) : null,
      }
    })
  }
}
