import { ApplicationStatus } from "@prisma/client"
import { IsEnum, IsString, MaxLength } from "class-validator"

export class UpdateApplicationStatusDto {
  @IsString()
  @MaxLength(191)
  applicationId!: string

  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus
}
