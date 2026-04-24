import { IsString, Matches } from "class-validator"

export class ResumeParamsDto {
  @IsString()
  @Matches(/^[^/\\]+$/, { message: "Invalid file name" })
  fileName: string
}
