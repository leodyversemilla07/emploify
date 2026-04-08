import { Injectable } from "@nestjs/common"

import type { ExperienceLevel } from "@prisma/client"
import type { ExternalJob } from "./job.types.js"

@Injectable()
export class LeverProvider {
  private inferExperienceLevel(text: string): ExperienceLevel | null {
    const haystack = text.toLowerCase()

    if (haystack.includes("intern")) return "INTERN"
    if (haystack.includes("junior")) return "JUNIOR"
    if (haystack.includes("senior")) return "SENIOR"
    if (haystack.includes("mid")) return "MID"

    return null
  }

  async fetchJobs(): Promise<ExternalJob[]> {
    const companyHandle = process.env.LEVER_COMPANY_HANDLE

    if (!companyHandle) return []

    const res = await fetch(
      `https://api.lever.co/v0/postings/${companyHandle}?mode=json`
    )

    if (!res.ok) return []

    const data = (await res.json()) as Array<{
      text: string
      categories?: { location?: string; commitment?: string; team?: string }
      descriptionPlain?: string
      createdAt?: number
    }>

    return data.map((job) => {
      const description = job.descriptionPlain ?? job.text
      const text = `${job.text} ${description}`
      const location = job.categories?.location ?? null

      return {
        title: job.text,
        company: process.env.LEVER_COMPANY_NAME ?? companyHandle,
        location,
        description,
        source: "Lever",
        remote: (location ?? "").toLowerCase().includes("remote"),
        experienceLevel: this.inferExperienceLevel(text),
        postedAt: job.createdAt ? new Date(job.createdAt) : null,
      }
    })
  }
}
