// Course-related types for Bibliology LMS

export enum CourseLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface Course {
  id: string;
  slug: string;
  teacher_id: string;
  title_en: string;
  title_fr: string | null;
  description_en: string;
  description_fr: string | null;
  thumbnail_url: string | null;
  cover_image_url: string | null;
  status: CourseStatus;
  category: string | null;
  tags: string[];
  estimated_hours: number | null;
  difficulty: string | null; // CourseLevel
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
}

export interface CourseDto {
  id: string;
  slug: string;
  teacher_id: string;
  title_en: string;
  title_fr: string | null;
  description_en: string;
  description_fr: string | null;
  thumbnail_url: string | null;
  cover_image_url: string | null;
  status: CourseStatus;
  category: string | null;
  tags: string[];
  estimated_hours: number | null;
  difficulty: string | null;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
  lesson_count?: number;
  enrollment_count?: number;
}

export interface CreateCourseInput {
  slug: string;
  teacher_id: string;
  title_en: string;
  title_fr?: string;
  description_en: string;
  description_fr?: string;
  thumbnail_url?: string;
  cover_image_url?: string;
  category?: string;
  tags?: string[];
  estimated_hours?: number;
  difficulty?: string;
}

export interface UpdateCourseInput {
  slug?: string;
  title_en?: string;
  title_fr?: string;
  description_en?: string;
  description_fr?: string;
  thumbnail_url?: string;
  cover_image_url?: string;
  status?: CourseStatus;
  category?: string;
  tags?: string[];
  estimated_hours?: number;
  difficulty?: string;
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
}

export interface Enrollment {
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
}

export interface EnrollmentDto {
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
  course?: CourseDto;
}
