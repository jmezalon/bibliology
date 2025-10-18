import { EnrollmentStatus } from '@prisma/client';

export class EnrollmentResponseDto {
  id: string;
  student_id: string;
  course_id: string;
  status: EnrollmentStatus;
  progress_percentage: number;
  lessons_completed: number;
  total_lessons: number;
  enrolled_at: Date;
  last_accessed_at: Date;
  completed_at: Date | null;

  // Optional course details
  course?: {
    id: string;
    slug: string;
    title_en: string;
    title_fr: string | null;
    thumbnail_url: string | null;
    status: string;
    estimated_hours: number | null;
    teacher: {
      id: string;
      name: string;
      avatar_url: string | null;
    };
  };

  // Optional student details (for teacher view)
  student?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
}
