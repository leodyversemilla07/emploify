import { ForbiddenException, UnauthorizedException } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import type { INestApplication } from "@nestjs/common"
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
    await app.init()
  })

  afterAll(async () => {
    if (app) {
      await app.close()
    }
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

  it("uses the session user instead of any spoofed email on save", async () => {
    mockedRequireSession.mockResolvedValueOnce({
      user: { id: "user-1", email: "member@example.com" },
    })
    jobService.saveJob.mockResolvedValueOnce({ id: "saved-1" })

    await request(app.getHttpServer())
      .post("/jobs/save")
      .send({ jobId: "job-1", email: "attacker@example.com" })
      .expect(201)

    expect(jobService.saveJob).toHaveBeenCalledWith({
      jobId: "job-1",
      email: "member@example.com",
    })
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

  it("uses the session user instead of any spoofed email on profile updates", async () => {
    mockedRequireSession.mockResolvedValueOnce({
      user: { id: "user-2", email: "owner@example.com" },
    })
    userService.upsertProfile.mockResolvedValueOnce({ id: "profile-1" })

    await request(app.getHttpServer())
      .put("/users/profile")
      .send({
        name: "Owner",
        email: "attacker@example.com",
        location: "Remote",
        resumeUrl: "http://localhost:4000/users/profile/resume/user-1-secret.txt",
      })
      .expect(200)

    expect(userService.upsertProfile).toHaveBeenCalledWith({
      name: "Owner",
      location: "Remote",
      email: "owner@example.com",
    })
  })

  it("serves resume downloads only to the owning authenticated user", async () => {
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
      .expect(404)

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
})
