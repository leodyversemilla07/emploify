import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import type { ExperienceLevel } from "@prisma/client"
import { access, mkdir, unlink, writeFile } from "node:fs/promises"
import { basename, join } from "node:path"
import type { Response as ExpressResponse } from "express"

import { AiService } from "../ai/ai.service.js"
import { AuthGuard } from "../auth/auth.guard.js"
import { CurrentUser } from "../auth/current-user.decorator.js"
import type { SessionUser } from "../auth/auth.types.js"
// biome-ignore lint/style/useImportType: NestJS dependency injection requires a runtime class reference.
import { UserService } from "./user.service.js"

@Controller("users")
@UseGuards(AuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly aiService: AiService,
  ) {}

  @Get("profile")
  async getProfile(@CurrentUser() currentUser: SessionUser) {
    const user = await this.userService.getProfileByEmail(currentUser.email)

    if (!user) {
      return { error: "User not found" }
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      profile: user.profile,
      metrics: {
        savedJobs: user.savedJobs.length,
        applications: user.applications.length,
      },
    }
  }

  @Post("profile/resume")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    })
  )
  async uploadResume(
    @CurrentUser() currentUser: SessionUser,
    @UploadedFile() file?: { buffer: Buffer; mimetype: string; originalname: string }
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException("Resume file is required")
    }

    const allowedMimeTypes = new Map([
      ["text/plain", ".txt"],
      ["application/pdf", ".pdf"],
      ["application/msword", ".doc"],
      [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".docx",
      ],
    ])
    const safeExtension = allowedMimeTypes.get(file.mimetype)

    if (!safeExtension) {
      throw new BadRequestException(
        "Unsupported file type. Upload TXT, PDF, DOC, or DOCX."
      )
    }

    const uploadsDir = join(process.cwd(), "uploads", "resumes")
    await mkdir(uploadsDir, { recursive: true })

    const existingUser = await this.userService.getProfileByEmail(currentUser.email)
    const previousResumeFileName = existingUser?.profile?.resumeUrl?.split("/").pop() ?? null

    const fileName = `${currentUser.id}-${Date.now()}${safeExtension}`
    const filePath = join(uploadsDir, fileName)
    await writeFile(filePath, file.buffer)

    const baseURL = (process.env.BETTER_AUTH_URL ?? "http://localhost:4000").replace(/\/$/, "")
    const resumeUrl = `${baseURL}/users/profile/resume/${fileName}`

    const parsed = file.mimetype === "text/plain"
      ? await this.aiService.parseResumeText(file.buffer.toString("utf-8"))
      : null

    try {
      await this.userService.updateResumeProfile({
        email: currentUser.email,
        resumeUrl,
        parsed,
      })
    } catch (error) {
      try {
        await unlink(filePath)
      } catch (cleanupError) {
        if ((cleanupError as NodeJS.ErrnoException).code !== "ENOENT") {
          throw cleanupError
        }
      }

      throw error
    }

    if (previousResumeFileName && previousResumeFileName !== fileName) {
      const previousResumePath = join(uploadsDir, previousResumeFileName)
      await unlink(previousResumePath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") {
          throw error
        }
      })
    }

    return {
      resumeUrl,
      parsedProfile: parsed,
      parseStatus: parsed ? "parsed" : "uploaded",
    }
  }

  @Get("profile/resume/:fileName")
  async getResume(
    @CurrentUser() currentUser: SessionUser,
    @Param("fileName") fileName: string,
    @Res() res: ExpressResponse,
  ) {
    if (!fileName || basename(fileName) !== fileName) {
      throw new BadRequestException("Invalid resume file name")
    }

    const user = await this.userService.getProfileByEmail(currentUser.email)
    const storedResumeUrl = user?.profile?.resumeUrl

    if (!storedResumeUrl || !storedResumeUrl.endsWith(`/${fileName}`)) {
      throw new NotFoundException("Resume not found")
    }

    const filePath = join(process.cwd(), "uploads", "resumes", fileName)

    try {
      await access(filePath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new NotFoundException("Resume not found")
      }

      throw error
    }

    res.setHeader("X-Content-Type-Options", "nosniff")
    return res.download(filePath, fileName)
  }

  @Put("profile")
  async upsertProfile(
    @CurrentUser() currentUser: SessionUser,
    @Body()
    body: {
      name?: string
      location?: string
      skills?: string
      experienceLevel?: ExperienceLevel | null
    }
  ) {
    const { name, location, skills, experienceLevel } = body

    return this.userService.upsertProfile({
      email: currentUser.email,
      name,
      location,
      skills,
      experienceLevel,
    })
  }
}
