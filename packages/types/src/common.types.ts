// Common shared types for Bibliology LMS

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationErrorResponse extends ErrorResponse {
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: {
      errors: ValidationError[];
    };
  };
}

export type SortOrder = 'asc' | 'desc';

export interface FilterParams {
  search?: string;
  status?: string;
  category?: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;
}

export interface BilingualContent {
  en: string;
  fr?: string;
}

export interface FileUploadResponse {
  success: boolean;
  url: string;
  filename: string;
  size: number;
  mime_type: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any> | null;
  created_at: Date;
}

export interface StudentNote {
  id: string;
  student_id: string;
  lesson_id: string;
  slide_index: number;
  note_text: string;
  created_at: Date;
  updated_at: Date;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string | null;
  lesson_id: string | null;
  certificate_url: string;
  certificate_number: string;
  issued_at: Date;
}

export interface CertificateDto {
  id: string;
  user_id: string;
  course_id: string | null;
  lesson_id: string | null;
  certificate_url: string;
  certificate_number: string;
  issued_at: Date;
  course_title?: string;
  lesson_title?: string;
}

export type Language = 'en' | 'fr';

export interface LocalizedContent<T> {
  en: T;
  fr?: T;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  database: 'connected' | 'disconnected';
  version: string;
}
