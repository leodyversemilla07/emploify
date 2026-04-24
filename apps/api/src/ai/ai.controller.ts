import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common"

import { AuthGuard } from "../auth/auth.guard.js"
import { CurrentUser } from "../auth/current-user.decorator.js"
import type { SessionUser } from "../auth/auth.types.js"
// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { AiService } from "./ai.service.js"
import { MatchQueryDto } from "./dto/match-query.dto.js"
import { ParseResumeDto } from "./dto/parse-resume.dto.js"

@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get("match")
  @UseGuards(AuthGuard)
  async getJobMatch(
    @CurrentUser() currentUser: SessionUser,
    @Query() dto: MatchQueryDto,
  ) {
    if (!dto.jobId) {
      return {
        score: 0,
        strengths: [],
        missingSkills: [],
        matchedSkills: [],
        profileSkills: [],
      }
    }

    return this.aiService.getJobMatch({ email: currentUser.email, jobId: dto.jobId })
  }

  @Get("recommendations")
  @UseGuards(AuthGuard)
  async getRecommendations(@CurrentUser() currentUser: SessionUser) {
    return this.aiService.getRecommendations(currentUser.email)
  }

  @Get("match/explain")
  @UseGuards(AuthGuard)
  async getJobMatchExplanation(
    @CurrentUser() currentUser: SessionUser,
    @Query() dto: MatchQueryDto,
  ) {
    if (!dto.jobId) {
      return {
        explanation: "Provide a jobId to get an AI match explanation.",
        scoreBreakdown: "",
        suggestion: "",
      }
    }

    return this.aiService.getJobMatchExplanation({
      email: currentUser.email,
      jobId: dto.jobId,
    })
  }

  @Post("parse-resume")
  async parseResume(@Body() body: ParseResumeDto) {
    return this.aiService.parseResumeText(body.resumeText)
  }

  @Post("parse-resume-and-update")
  @UseGuards(AuthGuard)
  async parseResumeAndUpdate(
    @CurrentUser() currentUser: SessionUser,
    @Body() body: ParseResumeDto,
  ) {
    return this.aiService.parseResumeAndUpdateProfile({
      email: currentUser.email,
      resumeText: body.resumeText,
    })
  }
}
