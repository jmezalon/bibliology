// Quiz-related types for Bibliology LMS

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  FILL_BLANK = 'FILL_BLANK',
  MATCHING = 'MATCHING',
}

export interface Quiz {
  id: string;
  lesson_id: string;
  slide_id: string | null;
  title_en: string;
  title_fr: string | null;
  passing_score_percentage: number;
  time_limit_minutes: number | null;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  allow_review: boolean;
  show_correct_answers: boolean;
  max_attempts: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface QuizDto {
  id: string;
  lesson_id: string;
  slide_id: string | null;
  title_en: string;
  title_fr: string | null;
  passing_score_percentage: number;
  time_limit_minutes: number | null;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  allow_review: boolean;
  show_correct_answers: boolean;
  max_attempts: number | null;
  created_at: Date;
  updated_at: Date;
  questions?: Question[];
  question_count?: number;
}

export interface CreateQuizInput {
  lesson_id: string;
  slide_id?: string;
  title_en: string;
  title_fr?: string;
  passing_score_percentage?: number;
  time_limit_minutes?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  allow_review?: boolean;
  show_correct_answers?: boolean;
  max_attempts?: number;
}

export interface UpdateQuizInput {
  title_en?: string;
  title_fr?: string;
  passing_score_percentage?: number;
  time_limit_minutes?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  allow_review?: boolean;
  show_correct_answers?: boolean;
  max_attempts?: number;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_order: number;
  question_type: QuestionType;
  question_text_en: Record<string, unknown>; // JSON
  question_text_fr: Record<string, unknown> | null; // JSON
  options_en: Record<string, unknown> | null; // JSON
  options_fr: Record<string, unknown> | null; // JSON
  correct_answers: Record<string, unknown>; // JSON
  explanation_en: Record<string, unknown> | null; // JSON
  explanation_fr: Record<string, unknown> | null; // JSON
  points: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateQuestionInput {
  quiz_id: string;
  question_order: number;
  question_type: QuestionType;
  question_text_en: Record<string, unknown>;
  question_text_fr?: Record<string, unknown>;
  options_en?: Record<string, unknown>;
  options_fr?: Record<string, unknown>;
  correct_answers: Record<string, unknown>;
  explanation_en?: Record<string, unknown>;
  explanation_fr?: Record<string, unknown>;
  points?: number;
}

export interface UpdateQuestionInput {
  question_order?: number;
  question_type?: QuestionType;
  question_text_en?: Record<string, unknown>;
  question_text_fr?: Record<string, unknown>;
  options_en?: Record<string, unknown>;
  options_fr?: Record<string, unknown>;
  correct_answers?: Record<string, unknown>;
  explanation_en?: Record<string, unknown>;
  explanation_fr?: Record<string, unknown>;
  points?: number;
}

export interface QuizSubmission {
  id: string;
  quiz_id: string;
  student_id: string;
  score_percentage: number;
  points_earned: number;
  total_points: number;
  passed: boolean;
  time_spent_seconds: number | null;
  started_at: Date;
  submitted_at: Date | null;
  updated_at: Date;
}

export interface QuizSubmissionDto {
  id: string;
  quiz_id: string;
  student_id: string;
  score_percentage: number;
  points_earned: number;
  total_points: number;
  passed: boolean;
  time_spent_seconds: number | null;
  started_at: Date;
  submitted_at: Date | null;
  updated_at: Date;
  quiz?: QuizDto;
  answers?: QuestionAnswer[];
}

export interface CreateQuizSubmissionInput {
  quiz_id: string;
  student_id: string;
}

export interface SubmitQuizInput {
  answers: {
    question_id: string;
    answer_given: Record<string, unknown>;
  }[];
  time_spent_seconds?: number;
}

export interface QuestionAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  answer_given: Record<string, unknown>; // JSON
  is_correct: boolean;
  points_earned: number;
  answered_at: Date;
}

export interface QuizAttemptSummary {
  submission_id: string;
  score_percentage: number;
  passed: boolean;
  submitted_at: Date | null;
  time_spent_seconds: number | null;
}

export interface QuizStats {
  total_attempts: number;
  average_score: number;
  pass_rate: number;
  best_score: number;
  attempts: QuizAttemptSummary[];
}
