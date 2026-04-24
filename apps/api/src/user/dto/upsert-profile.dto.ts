import { ExperienceLevel } from "@prisma/client"
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator"

export class UpsertProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  skills?: string

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel | null
}
