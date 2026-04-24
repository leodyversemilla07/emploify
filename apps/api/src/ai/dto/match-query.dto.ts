import { IsOptional, IsString } from "class-validator"

export class MatchQueryDto {
  @IsOptional()
  @IsString()
  jobId?: string
}
