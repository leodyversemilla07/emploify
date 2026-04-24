import { IsString, MaxLength } from "class-validator"

export class SaveJobDto {
  @IsString()
  @MaxLength(191)
  jobId!: string
}
