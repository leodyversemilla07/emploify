import { IsString, MaxLength } from "class-validator"

export class UpdateApplicationNotesDto {
  @IsString()
  @MaxLength(191)
  applicationId!: string

  @IsString()
  @MaxLength(5000)
  notes!: string
}
