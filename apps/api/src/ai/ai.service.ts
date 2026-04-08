import { Injectable } from "@nestjs/common"
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity"
import { AzureOpenAI } from "openai"

// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { PrismaService } from "../prisma/prisma.service.js"

import type {
  ExperienceLevel,
  Job,
  Profile,
} from "@prisma/client"

const knownSkills = [
  "react",
  "next.js",
  "nextjs",
  "typescript",
  "javascript",
  "nestjs",
  "node.js",
  "node",
  "postgresql",
  "prisma",
  "tailwind",
  "design systems",
  "api",
  "apis",
  "sql",
  "graphql",
  "docker",
  "aws",
  "testing",
  "redis",
  "python",
  "java",
] as const

type MatchResult = {
  score: number
  strengths: string[]
  missingSkills: string[]
  matchedSkills: string[]
  profileSkills: string[]
}

type ResumeParseResult = {
  summary: string
  location: string | null
  skills: string[]
  experienceLevel: "INTERN" | "JUNIOR" | "MID" | "SENIOR" | null
}

type RecommendationResult = {
  recommendations: Array<{
    applicationId: string
    jobId: string
    title: string
    company: string
    status: string
    score: number
    missingSkills: string[]
    strengths: string[]
  }>
  topMissingSkills: Array<{
    skill: string
    count: number
  }>
}

type MatchExplanation = {
  explanation: string
  scoreBreakdown: string
  suggestion: string
}

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService
  ) {
    this.initializeAzureClient()
  }

  private openai!: AzureOpenAI | null

  private async initializeAzureClient() {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT
    const apiKey = process.env.AZURE_OPENAI_API_KEY

    if (endpoint && deployment) {
      try {
        if (apiKey) {
          // Use API key authentication
          this.openai = new AzureOpenAI({
            endpoint,
            deployment,
            apiKey,
            apiVersion: "2024-10-21",
          })
        } else {
          // Use Entra ID (managed identity / default credentials)
          const credential = new DefaultAzureCredential()
          const scope = "https://cognitiveservices.azure.com/.default"
          const azureADTokenProvider = getBearerTokenProvider(credential, scope)
          this.openai = new AzureOpenAI({
            azureADTokenProvider,
            deployment,
            apiVersion: "2024-10-21",
          })
        }
        // biome-ignore lint/nursery/noConsole: Logging startup status for debugging
        console.log("[AiService] Azure OpenAI client initialized")
      } catch (error) {
        // biome-ignore lint/nursery/noConsole: Logging initialization error
        console.error("[AiService] Failed to initialize Azure OpenAI:", error)
        this.openai = null
      }
    } else {
      // biome-ignore lint/nursery/noConsole: Logging fallback status
      console.log("[AiService] Azure OpenAI not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_DEPLOYMENT to enable.")
      this.openai = null
    }
  }

  private normalizeSkills(input: string | null | undefined) {
    return (input ?? "")
      .split(",")
      .map((skill) => skill.trim().toLowerCase())
      .filter(Boolean)
  }

  private extractSkills(text: string) {
    const haystack = text.toLowerCase()

    return knownSkills.filter((skill) => haystack.includes(skill))
  }

  private inferExperienceLevel(
    text: string
  ): ResumeParseResult["experienceLevel"] {
    const haystack = text.toLowerCase()
    const yearsMatch = haystack.match(/(\d+)\+?\s+years?/)
    const years = yearsMatch ? Number(yearsMatch[1]) : 0

    if (haystack.includes("senior") || years >= 5) return "SENIOR"
    if (haystack.includes("mid") || years >= 3) return "MID"
    if (haystack.includes("intern") || haystack.includes("internship")) {
      return "INTERN"
    }
    if (haystack.includes("junior") || years >= 1) return "JUNIOR"

    return null
  }

  private inferLocation(text: string) {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    const labeledLocation = lines.find((line) => /^location\s*:/i.test(line))
    if (labeledLocation) {
      return labeledLocation.replace(/^location\s*:/i, "").trim() || null
    }

    const cityLine = lines.find(
      (line) => line.includes(",") && line.length <= 60 && !line.includes("@")
    )

    return cityLine ?? null
  }

  private computeExperienceScore(
    profileLevel: ExperienceLevel | null | undefined,
    jobLevel: ExperienceLevel | null | undefined
  ) {
    if (!profileLevel || !jobLevel) return 0
    if (profileLevel === jobLevel) return 15
    if (
      profileLevel === "SENIOR" &&
      ["MID", "JUNIOR", "INTERN"].includes(jobLevel)
    ) {
      return 10
    }
    if (profileLevel === "MID" && ["JUNIOR", "INTERN"].includes(jobLevel)) {
      return 8
    }
    if (profileLevel === "JUNIOR" && jobLevel === "INTERN") {
      return 6
    }

    return 0
  }

  private buildMatch(profile: Profile | null, job: Job): MatchResult {
    const profileSkills = this.normalizeSkills(profile?.skills)
    const jobSkills = this.extractSkills(
      `${job.title} ${job.description} ${job.company} ${job.source}`
    )

    const matchedSkills = jobSkills.filter((skill) =>
      profileSkills.some(
        (profileSkill) =>
          profileSkill.includes(skill) || skill.includes(profileSkill)
      )
    )

    const missingSkills = jobSkills.filter(
      (skill) => !matchedSkills.includes(skill)
    )

    let score = 35

    if (jobSkills.length > 0) {
      score += Math.round((matchedSkills.length / jobSkills.length) * 45)
    }

    score += this.computeExperienceScore(
      profile?.experienceLevel,
      job.experienceLevel
    )

    if (job.remote && profile?.location) {
      score += 5
    }

    score = Math.max(0, Math.min(score, 100))

    const strengths: string[] = []

    if (matchedSkills.length > 0) {
      strengths.push(`Matched skills: ${matchedSkills.slice(0, 3).join(", ")}`)
    }

    if (profile?.experienceLevel && job.experienceLevel) {
      strengths.push(
        profile.experienceLevel === job.experienceLevel
          ? `Experience level aligns at ${job.experienceLevel.toLowerCase()}.`
          : `Your current profile is ${profile.experienceLevel.toLowerCase()} for a ${job.experienceLevel.toLowerCase()} role.`
      )
    }

    if (job.remote) {
      strengths.push("This role supports remote work.")
    }

    if (strengths.length === 0) {
      strengths.push(
        "Complete your profile skills to unlock stronger matching."
      )
    }

    return {
      score,
      strengths: strengths.slice(0, 3),
      missingSkills: missingSkills.slice(0, 5),
      matchedSkills,
      profileSkills,
    }
  }

  parseResumeText(resumeText: string): ResumeParseResult {
    const cleaned = resumeText.trim()
    const skills = this.extractSkills(cleaned)
    const experienceLevel = this.inferExperienceLevel(cleaned)
    const location = this.inferLocation(cleaned)

    return {
      summary:
        cleaned.length > 220 ? `${cleaned.slice(0, 220).trim()}...` : cleaned,
      location,
      skills,
      experienceLevel,
    }
  }

  async getJobMatch(input: {
    email: string
    jobId: string
  }): Promise<MatchResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { profile: true },
    })

    const job = await this.prisma.job.findUnique({
      where: { id: input.jobId },
    })

    if (!user || !job) {
      throw new Error("Match context not found")
    }

    return this.buildMatch(user.profile, job)
  }

  async getRecommendations(email: string): Promise<RecommendationResult> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        applications: {
          include: {
            job: true,
          },
        },
      },
    })

    if (!user) {
      return {
        recommendations: [],
        topMissingSkills: [],
      }
    }

    const enriched = user.applications.map((application) => {
      const match = this.buildMatch(user.profile, application.job)

      return {
        applicationId: application.id,
        jobId: application.job.id,
        title: application.job.title,
        company: application.job.company,
        status: application.status,
        score: match.score,
        missingSkills: match.missingSkills,
        strengths: match.strengths,
      }
    })

    const recommendations = enriched
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    const missingSkillCounts = new Map<string, number>()

    for (const item of enriched) {
      for (const skill of item.missingSkills) {
        missingSkillCounts.set(skill, (missingSkillCounts.get(skill) ?? 0) + 1)
      }
    }

    const topMissingSkills = Array.from(missingSkillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, count }))

    return {
      recommendations,
      topMissingSkills,
    }
  }

  async getJobMatchExplanation(input: {
    email: string
    jobId: string
  }): Promise<MatchExplanation> {
    if (!this.openai) {
      return {
        explanation:
          "AI explanations are not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_DEPLOYMENT in the backend environment to enable detailed match insights.",
        scoreBreakdown: "Configure Azure OpenAI to see score breakdown.",
        suggestion: "Add your Azure OpenAI credentials to .env and restart the backend.",
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { profile: true },
    })

    const job = await this.prisma.job.findUnique({
      where: { id: input.jobId },
    })

    if (!user || !job) {
      throw new Error("Match context not found")
    }

    const match = this.buildMatch(user.profile, job)

    const profileSummary = `
User Profile:
- Skills: ${user.profile?.skills ?? "None provided"}
- Experience level: ${user.profile?.experienceLevel ?? "Not specified"}
- Location: ${user.profile?.location ?? "Not specified"}
`.trim()

    const jobSummary = `
Job Details:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location ?? "Not specified"}
- Source: ${job.source}
- Remote: ${job.remote ? "Yes" : "No"}
- Experience level: ${job.experienceLevel ?? "Not specified"}
- Description: ${job.description}
`.trim()

    const prompt = `
You are an AI career advisor. Given a user profile and a job description, provide a helpful match explanation.

${profileSummary}

${jobSummary}

Match score: ${match.score}/100
Strengths: ${match.strengths.join(", ") || "None identified"}
Missing skills: ${match.missingSkills.join(", ") || "None identified"}

Please provide:
1. A friendly explanation of why this score was given (2-3 sentences).
2. A breakdown of how the score was calculated (skills match, experience, location, remote work).
3. One actionable suggestion to improve the match score or next steps.

Format your response as JSON with keys: explanation, scoreBreakdown, suggestion.
`

    try {
      if (!this.openai) {
        throw new Error("Azure OpenAI client not initialized")
      }

      const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-35-turbo"

      const completion = await this.openai!.chat.completions.create({
        model: deployment,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" },
      })

      const message = completion.choices[0]?.message

      if (!message?.content) {
        throw new Error("Empty response from OpenAI")
      }

      const content = message.content

      const parsed = JSON.parse(content) as {
        explanation: string
        scoreBreakdown: string
        suggestion: string
      }

      return {
        explanation: parsed.explanation ?? "Unable to generate explanation.",
        scoreBreakdown: parsed.scoreBreakdown ?? "Score breakdown unavailable.",
        suggestion:
          parsed.suggestion ??
          "Consider updating your profile with more skills.",
      }
    } catch (_error) {
      return {
        explanation:
          "Unable to generate AI explanation at this time. Please try again later.",
        scoreBreakdown:
          "AI explanation service temporarily unavailable. Showing heuristic match details instead.",
        suggestion:
          "Check your Azure OpenAI configuration and quota, or try again in a few minutes.",
      }
    }
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
