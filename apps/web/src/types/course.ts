export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface Course {
  id: string;
  title_en: string;
  title_fr: string | null;
  description_en: string;
  description_fr: string | null;
  thumbnail_url: string | null;
  level: CourseLevel;
  category: string;
  teacher_id: string;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
  _count?: {
    lessons: number;
    enrollments: number;
  };
}

export interface Lesson {
  id: string;
  course_id: string;
  title_en: string;
  title_fr: string | null;
  description_en: string;
  description_fr: string | null;
  order: number;
  duration_minutes: number;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
  _count?: {
    slides: number;
  };
}

export interface CreateCourseRequest {
  title_en: string;
  title_fr?: string;
  description_en: string;
  description_fr?: string;
  level: CourseLevel;
  category: string;
  thumbnail_url?: string;
}

export interface UpdateCourseRequest extends Partial<CreateCourseRequest> {
  is_published?: boolean;
}

export interface CreateLessonRequest {
  course_id: string;
  title_en: string;
  title_fr?: string;
  description_en: string;
  description_fr?: string;
  duration_minutes: number;
  order?: number;
}

export interface UpdateLessonRequest extends Partial<CreateLessonRequest> {
  is_published?: boolean;
}
