import type { ExperienceLevel } from "../generated/prisma/client.js"

export type ExternalJob = {
  title: string
  company: string
  location: string | null
  description: string
  source: string
  remote: boolean
  experienceLevel: ExperienceLevel | null
  postedAt: Date | null
}
