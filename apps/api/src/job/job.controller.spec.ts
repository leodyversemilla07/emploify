jest.mock("../auth/auth.guard.js", () => ({
  AdminGuard: class AdminGuard {},
  AuthGuard: class AuthGuard {},
  OptionalAuthGuard: class OptionalAuthGuard {},
}))

jest.mock("../auth/current-user.decorator.js", () => ({
  CurrentUser: () => () => undefined,
}))

import { JobController } from "./job.controller.js"
import { ListJobsDto } from "./dto/list-jobs.dto.js"
import type { SessionUser } from "../auth/auth.types.js"

function createJobService() {
  return {
    getSyncStatus: jest.fn(),
    listJobs: jest.fn(),
    saveJob: jest.fn(),
    syncJobs: jest.fn(),
  }
}

describe("JobController", () => {
  it("lists jobs anonymously without an email", async () => {
    const jobService = createJobService()
    const controller = new JobController(jobService as never)
    const dto = new ListJobsDto()
    dto.search = "react"
    dto.location = "remote"
    dto.source = "Lever"
    dto.remote = true
    dto.experienceLevel = "MID" as any

    await controller.listJobs(null, dto)

    expect(jobService.listJobs).toHaveBeenCalledWith({
      email: undefined,
      search: "react",
      location: "remote",
      source: "Lever",
      remote: true,
      experienceLevel: "MID",
    })
  })

  it("passes the authenticated user email when listing jobs", async () => {
    const jobService = createJobService()
    const controller = new JobController(jobService as never)
    const user = { id: "user-1", email: "member@example.com" } as SessionUser

    await controller.listJobs(user, new ListJobsDto())

    expect(jobService.listJobs).toHaveBeenCalledWith({
      email: "member@example.com",
      search: undefined,
      location: undefined,
      source: undefined,
      remote: undefined,
      experienceLevel: undefined,
    })
  })

  it("saves jobs for the authenticated user", async () => {
    const jobService = createJobService()
    const controller = new JobController(jobService as never)
    const user = { id: "user-2", email: "member@example.com" } as SessionUser

    await controller.saveJob(user, { jobId: "job-123" })

    expect(jobService.saveJob).toHaveBeenCalledWith({
      email: "member@example.com",
      jobId: "job-123",
    })
  })

  it("delegates sync requests to the job service", async () => {
    const jobService = createJobService()
    const controller = new JobController(jobService as never)

    await controller.syncJobs()

    expect(jobService.syncJobs).toHaveBeenCalledTimes(1)
  })
})
