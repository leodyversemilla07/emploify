import { ForbiddenException, UnauthorizedException, ValidationPipe } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import type { INestApplication } from "@nestjs/common"
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import request from "supertest"

jest.mock("./auth-session.js", () => ({
  getSessionFromRequest: jest.fn(),
  requireAdminSession: jest.fn(),
  requireSession: jest.fn(),
}))

import { AdminGuard, AuthGuard, OptionalAuthGuard } from "./auth.guard.js"
import * as authSession from "./auth-session.js"
import { AiService } from "../ai/ai.service.js"
import { JobController } from "../job/job.controller.js"
import { JobService } from "../job/job.service.js"
import { UserController } from "../user/user.controller.js"
import { UserService } from "../user/user.service.js"

describe("auth integration", () => {
  let app: INestApplication
  let originalCwd: string
  let tempCwd: string

  const jobService = {
    getSyncStatus: jest.fn(),
    listJobs: jest.fn(),
    saveJob: jest.fn(),
    syncJobs: jest.fn(),
  }

  const userService = {
    getProfileByEmail: jest.fn(),
    updateResumeProfile: jest.fn(),
    upsertProfile: jest.fn(),
  }

  const aiService = {
    parseResumeText: jest.fn(),
  }

  const mockedRequireSession = jest.mocked(authSession.requireSession)
  const mockedGetSessionFromRequest = jest.mocked(authSession.getSessionFromRequest)
  const mockedRequireAdminSession = jest.mocked(authSession.requireAdminSession)

  beforeAll(async () => {
    originalCwd = process.cwd()
    tempCwd = await mkdtemp(join(tmpdir(), "emploify-api-test-"))
    process.chdir(tempCwd)

    const moduleRef = await Test.createTestingModule({
      controllers: [JobController, UserController],
      providers: [
        AuthGuard,
        OptionalAuthGuard,
        AdminGuard,
        { provide: JobService, useValue: jobService },
        { provide: UserService, useValue: userService },
        { provide: AiService, useValue: aiService },
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }))
    await app.init()
  })

  afterAll(async () => {
    if (app) {
      await app.close()
    }

    process.chdir(originalCwd)
    await rm(tempCwd, { force: true, recursive: true })
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns 401 for unauthenticated profile requests", async () => {
    mockedRequireSession.mockRejectedValueOnce(new UnauthorizedException())

    await request(app.getHttpServer()).get("/users/profile").expect(401)
  })

  it("allows anonymous job listing without session lookup", async () => {
    jobService.listJobs.mockResolvedValueOnce([{ id: "job-1" }])

    await request(app.getHttpServer())
      .get("/jobs?search=react&remote=true")
      .expect(200)
      .expect([{ id: "job-1" }])

    expect(mockedGetSessionFromRequest).not.toHaveBeenCalled()
    expect(jobService.listJobs).toHaveBeenCalledWith({
      email: undefined,
      search: "react",
      location: undefined,
      source: undefined,
      remote: true,
      experienceLevel: undefined,
    })
  })

  it("personalizes job listing for authenticated requests", async () => {
    mockedGetSessionFromRequest.mockResolvedValueOnce({
      user: { id: "user-1", email: "member@example.com" },
    })
    jobService.listJobs.mockResolvedValueOnce([{ id: "job-2" }])

    await request(app.getHttpServer())
      .get("/jobs")
      .set("Cookie", "session=abc")
      .expect(200)

    expect(jobService.listJobs).toHaveBeenCalledWith({
      email: "member@example.com",
      search: undefined,
      location: undefined,
      source: undefined,
      remote: undefined,
      experienceLevel: undefined,
    })
  })

  it("returns 401 for unauthenticated save requests", async () => {
    mockedRequireSession.mockRejectedValueOnce(new UnauthorizedException())

    await request(app.getHttpServer())
      .post("/jobs/save")
      .send({ jobId: "job-1" })
      .expect(401)
  })

  it("rejects spoofed extra fields on save requests", async () => {
    mockedRequireSession.mockResolvedValueOnce({
      user: { id: "user-1", email: "member@example.com" },
    })

    await request(app.getHttpServer())
      .post("/jobs/save")
      .send({ jobId: "job-1", email: "attacker@example.com" })
      .expect(400)

    expect(jobService.saveJob).not.toHaveBeenCalled()
  })

  it("returns 401 for unauthenticated sync requests", async () => {
    mockedRequireAdminSession.mockRejectedValueOnce(new UnauthorizedException())

    await request(app.getHttpServer()).post("/jobs/sync").expect(401)
  })

  it("returns 403 for authenticated non-admin sync requests", async () => {
    mockedRequireAdminSession.mockRejectedValueOnce(new ForbiddenException())

    await request(app.getHttpServer())
      .post("/jobs/sync")
      .set("Cookie", "session=abc")
      .expect(403)
  })

  it("allows configured admins to sync jobs", async () => {
    mockedRequireAdminSession.mockResolvedValueOnce({
      user: { id: "admin-1", email: "admin@example.com" },
    })
    jobService.syncJobs.mockResolvedValueOnce({ imported: 3 })

    await request(app.getHttpServer())
      .post("/jobs/sync")
      .set("Cookie", "session=admin")
      .expect(201)
      .expect({ imported: 3 })
  })

  it("rejects spoofed extra fields on profile updates", async () => {
    mockedRequireSession.mockResolvedValueOnce({
      user: { id: "user-2", email: "owner@example.com" },
    })

    await request(app.getHttpServer())
      .put("/users/profile")
      .send({
        name: "Owner",
        email: "attacker@example.com",
        location: "Remote",
        resumeUrl: "http://localhost:4000/users/profile/resume/user-1-secret.txt",
      })
      .expect(400)

    expect(userService.upsertProfile).not.toHaveBeenCalled()
  })

  it("serves resume downloads only to the owning authenticated user", async () => {
    const uploadsDir = join(tempCwd, "uploads", "resumes")
    await mkdir(uploadsDir, { recursive: true })
    await writeFile(join(uploadsDir, "user-3-123.txt"), "resume")

    mockedRequireSession.mockResolvedValueOnce({
      user: { id: "user-3", email: "owner@example.com" },
    })
    userService.getProfileByEmail.mockResolvedValueOnce({
      profile: {
        resumeUrl: "http://localhost:4000/users/profile/resume/user-3-123.txt",
      },
    })

    await request(app.getHttpServer())
      .get("/users/profile/resume/user-3-123.txt")
      .expect(200)
      .expect("Content-Disposition", /attachment; filename="user-3-123.txt"/)

    expect(userService.getProfileByEmail).toHaveBeenCalledWith("owner@example.com")
  })

  it("rejects resume downloads for non-matching files", async () => {
    mockedRequireSession.mockResolvedValueOnce({
      user: { id: "user-4", email: "owner@example.com" },
    })
    userService.getProfileByEmail.mockResolvedValueOnce({
      profile: {
        resumeUrl: "http://localhost:4000/users/profile/resume/user-4-123.txt",
      },
    })

    await request(app.getHttpServer())
      .get("/users/profile/resume/attacker.html")
      .expect(404)
  })

  it("rejects unsupported resume upload MIME types", async () => {
    mockedRequireSession.mockResolvedValueOnce({
      user: { id: "user-5", email: "owner@example.com" },
    })

    await request(app.getHttpServer())
      .post("/users/profile/resume")
      .attach("file", Buffer.from("<html></html>"), {
        contentType: "text/html",
        filename: "resume.html",
      })
      .expect(400)

    expect(userService.updateResumeProfile).not.toHaveBeenCalled()
  })

  it("uploads text resumes with safe extensions and parsed profile data", async () => {
    mockedRequireSession.mockResolvedValueOnce({
      user: { id: "user-6", email: "owner@example.com" },
    })
    userService.getProfileByEmail.mockResolvedValueOnce({ profile: null })
    aiService.parseResumeText.mockResolvedValueOnce({
      summary: "React developer",
      location: "Remote",
      skills: ["React", "TypeScript"],
      experienceLevel: "JUNIOR",
    })
    userService.updateResumeProfile.mockResolvedValueOnce({ id: "profile-1" })

    const response = await request(app.getHttpServer())
      .post("/users/profile/resume")
      .attach("file", Buffer.from("React developer"), {
        contentType: "text/plain",
        filename: "resume.html",
      })
      .expect(201)

    expect(response.body.resumeUrl).toMatch(
      /\/users\/profile\/resume\/user-6-\d+\.txt$/
    )
    expect(response.body.parseStatus).toBe("parsed")
    expect(aiService.parseResumeText).toHaveBeenCalledWith("React developer")
    expect(userService.updateResumeProfile).toHaveBeenCalledWith({
      email: "owner@example.com",
      resumeUrl: expect.stringMatching(
        /\/users\/profile\/resume\/user-6-\d+\.txt$/
      ),
      parsed: {
        summary: "React developer",
        location: "Remote",
        skills: ["React", "TypeScript"],
        experienceLevel: "JUNIOR",
      },
    })
  })

  it("deletes the previous stored resume after replacement uploads", async () => {
    const uploadsDir = join(tempCwd, "uploads", "resumes")
    const previousFileName = "user-7-old.txt"
    await mkdir(uploadsDir, { recursive: true })
    await writeFile(join(uploadsDir, previousFileName), "old resume")

    mockedRequireSession.mockResolvedValueOnce({
      user: { id: "user-7", email: "owner@example.com" },
    })
    userService.getProfileByEmail.mockResolvedValueOnce({
      profile: {
        resumeUrl: `http://localhost:4000/users/profile/resume/${previousFileName}`,
      },
    })
    userService.updateResumeProfile.mockResolvedValueOnce({ id: "profile-2" })

    await request(app.getHttpServer())
      .post("/users/profile/resume")
      .attach("file", Buffer.from("%PDF"), {
        contentType: "application/pdf",
        filename: "resume.pdf",
      })
      .expect(201)

    await expect(access(join(uploadsDir, previousFileName))).rejects.toMatchObject({
      code: "ENOENT",
    })
    expect(aiService.parseResumeText).not.toHaveBeenCalled()
    expect(userService.updateResumeProfile).toHaveBeenCalledWith({
      email: "owner@example.com",
      resumeUrl: expect.stringMatching(
        /\/users\/profile\/resume\/user-7-\d+\.pdf$/
      ),
      parsed: null,
    })
  })
})
