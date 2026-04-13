import { Controller, Get } from "@nestjs/common"

@Controller()
export class HealthController {
  @Get()
  getRoot() {
    return {
      status: "ok",
      service: "emploify-api",
      message: "Emploify API is running",
    }
  }

  @Get("health")
  getHealth() {
    return {
      status: "ok",
      service: "emploify-api",
    }
  }
}
