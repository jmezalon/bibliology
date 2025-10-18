export class StudentNoteResponseDto {
  id: string;
  student_id: string;
  lesson_id: string;
  slide_index: number;
  note_text: string;
  created_at: Date;
  updated_at: Date;
}
