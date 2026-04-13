import { Body, Controller, Get, Post, Query } from "@nestjs/common"

// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { AiService } from "./ai.service.js"

@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get("match")
  async getJobMatch(
    @Query("email") email?: string,
    @Query("jobId") jobId?: string
  ) {
    if (!email || !jobId) {
      return {
        score: 0,
        strengths: [],
        missingSkills: [],
        matchedSkills: [],
        profileSkills: [],
      }
    }

    return this.aiService.getJobMatch({ email, jobId })
  }

  @Get("recommendations")
  async getRecommendations(@Query("email") email?: string) {
    if (!email) {
      return {
        recommendations: [],
        topMissingSkills: [],
      }
    }

    return this.aiService.getRecommendations(email)
  }

  @Get("match/explain")
  async getJobMatchExplanation(
    @Query("email") email?: string,
    @Query("jobId") jobId?: string
  ) {
    if (!email || !jobId) {
      return {
        explanation: "Provide email and jobId to get an AI match explanation.",
        scoreBreakdown: "",
        suggestion: "",
      }
    }

    return this.aiService.getJobMatchExplanation({ email, jobId })
  }

  @Post("parse-resume")
  async parseResume(@Body() body: { resumeText?: string }) {
    if (!body.resumeText?.trim()) {
      return {
        summary: "",
        location: null,
        skills: [],
        experienceLevel: null,
      }
    }

    return this.aiService.parseResumeText(body.resumeText)
  }

  @Post("parse-resume-and-update")
  async parseResumeAndUpdate(
    @Body() body: { email?: string; resumeText?: string },
  ) {
    if (!body.email || !body.resumeText?.trim()) {
      return {
        summary: "",
        location: null,
        skills: [],
        experienceLevel: null,
      }
    }

    return this.aiService.parseResumeAndUpdateProfile({
      email: body.email,
      resumeText: body.resumeText,
    })
  }
}
