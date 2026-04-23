import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common"
import type { Request as ExpressRequest } from "express"

import { requireSession } from "../auth/auth-session.js"
// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { AiService } from "./ai.service.js"

@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get("match")
  async getJobMatch(
    @Req() req: ExpressRequest,
    @Query("jobId") jobId?: string
  ) {
    if (!jobId) {
      return {
        score: 0,
        strengths: [],
        missingSkills: [],
        matchedSkills: [],
        profileSkills: [],
      }
    }

    const session = await requireSession(req)
    return this.aiService.getJobMatch({ email: session.user.email, jobId })
  }

  @Get("recommendations")
  async getRecommendations(@Req() req: ExpressRequest) {
    const session = await requireSession(req)
    return this.aiService.getRecommendations(session.user.email)
  }

  @Get("match/explain")
  async getJobMatchExplanation(
    @Req() req: ExpressRequest,
    @Query("jobId") jobId?: string
  ) {
    if (!jobId) {
      return {
        explanation: "Provide a jobId to get an AI match explanation.",
        scoreBreakdown: "",
        suggestion: "",
      }
    }

    const session = await requireSession(req)
    return this.aiService.getJobMatchExplanation({
      email: session.user.email,
      jobId,
    })
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
    @Req() req: ExpressRequest,
    @Body() body: { resumeText?: string },
  ) {
    if (!body.resumeText?.trim()) {
      return {
        summary: "",
        location: null,
        skills: [],
        experienceLevel: null,
      }
    }

    const session = await requireSession(req)

    return this.aiService.parseResumeAndUpdateProfile({
      email: session.user.email,
      resumeText: body.resumeText,
    })
  }
}
