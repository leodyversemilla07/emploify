import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator"
import { Transform } from "class-transformer"
import { ExperienceLevel } from "@prisma/client"

export class ListJobsDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  location?: string

  @IsOptional()
  @IsString()
  source?: string

  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  remote?: boolean

  @IsOptional()
  @IsEnum(ExperienceLevel as any)
  experienceLevel?: ExperienceLevel
}
