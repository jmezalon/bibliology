import { IsString, IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  lesson_id: string;

  @IsInt()
  @Min(0)
  slide_index: number;

  @IsString()
  @IsNotEmpty()
  note_text: string;
}
