import { Injectable } from "@nestjs/common"

import type { ExperienceLevel } from "@prisma/client"
import type { ExternalJob } from "./job.types.js"

@Injectable()
export class GreenhouseProvider {
  private inferExperienceLevel(text: string): ExperienceLevel | null {
    const haystack = text.toLowerCase()

    if (haystack.includes("intern")) return "INTERN"
    if (haystack.includes("junior")) return "JUNIOR"
    if (haystack.includes("senior")) return "SENIOR"
    if (haystack.includes("mid")) return "MID"

    return null
  }

  async fetchJobs(): Promise<ExternalJob[]> {
    const boardToken = process.env.GREENHOUSE_BOARD_TOKEN

    if (!boardToken) return []

    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`
    )

    if (!res.ok) return []

    const data = (await res.json()) as {
      jobs?: Array<{
        title: string
        absolute_url?: string
        updated_at?: string
        location?: { name?: string }
        content?: string
      }>
    }

    return (data.jobs ?? []).map((job) => {
      const text = `${job.title} ${job.content ?? ""}`
      const location = job.location?.name ?? null

      return {
        title: job.title,
        company: process.env.GREENHOUSE_COMPANY_NAME ?? "Greenhouse Company",
        location,
        description: job.content?.replace(/<[^>]+>/g, " ").trim() || job.title,
        source: "Greenhouse",
        remote: (location ?? "").toLowerCase().includes("remote"),
        experienceLevel: this.inferExperienceLevel(text),
        postedAt: job.updated_at ? new Date(job.updated_at) : null,
      }
    })
  }
}
