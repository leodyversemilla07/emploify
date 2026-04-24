import { Transform } from "class-transformer"
import { IsString, MinLength, MaxLength } from "class-validator"

export class ParseResumeDto {
  @Transform(({ value }) => typeof value === "string" ? value.trim() : value)
  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  resumeText!: string
}
