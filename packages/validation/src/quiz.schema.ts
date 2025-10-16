import { z } from 'zod';

// Enums
export const QuestionTypeSchema = z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'FILL_BLANK', 'MATCHING']);

// Quiz configuration schema
export const quizConfigSchema = z.object({
  passing_score_percentage: z.number().int().min(0).max(100).default(70),
  time_limit_minutes: z.number().int().min(1).max(500).optional().nullable(),
  shuffle_questions: z.boolean().default(false),
  shuffle_options: z.boolean().default(false),
  allow_review: z.boolean().default(true),
  show_correct_answers: z.boolean().default(true),
  max_attempts: z.number().int().min(1).max(20).optional().nullable(),
});

// Create quiz schema
export const createQuizSchema = z.object({
  lesson_id: z.string().cuid('Invalid lesson ID'),
  slide_id: z.string().cuid('Invalid slide ID').optional().nullable(),
  title_en: z.string().min(1, 'English title is required').max(200),
  title_fr: z.string().max(200).optional().nullable(),
  passing_score_percentage: z.number().int().min(0).max(100).default(70),
  time_limit_minutes: z.number().int().min(1).max(500).optional().nullable(),
  shuffle_questions: z.boolean().default(false),
  shuffle_options: z.boolean().default(false),
  allow_review: z.boolean().default(true),
  show_correct_answers: z.boolean().default(true),
  max_attempts: z.number().int().min(1).max(20).optional().nullable(),
});

// Update quiz schema
export const updateQuizSchema = z.object({
  title_en: z.string().min(1).max(200).optional(),
  title_fr: z.string().max(200).optional().nullable(),
  passing_score_percentage: z.number().int().min(0).max(100).optional(),
  time_limit_minutes: z.number().int().min(1).max(500).optional().nullable(),
  shuffle_questions: z.boolean().optional(),
  shuffle_options: z.boolean().optional(),
  allow_review: z.boolean().optional(),
  show_correct_answers: z.boolean().optional(),
  max_attempts: z.number().int().min(1).max(20).optional().nullable(),
});

// Question schemas
const multipleChoiceOptionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Option text is required'),
});

const questionBaseSchema = z.object({
  quiz_id: z.string().cuid('Invalid quiz ID'),
  question_order: z.number().int().min(1),
  question_type: QuestionTypeSchema,
  points: z.number().int().min(1).default(1),
});

export const createQuestionSchema = z.discriminatedUnion('question_type', [
  // Multiple choice
  questionBaseSchema.extend({
    question_type: z.literal('MULTIPLE_CHOICE'),
    question_text_en: z.record(z.any()),
    question_text_fr: z.record(z.any()).optional().nullable(),
    options_en: z.array(multipleChoiceOptionSchema).min(2, 'At least 2 options are required'),
    options_fr: z.array(multipleChoiceOptionSchema).optional().nullable(),
    correct_answers: z.array(z.string()).min(1, 'At least one correct answer is required'),
    explanation_en: z.record(z.any()).optional().nullable(),
    explanation_fr: z.record(z.any()).optional().nullable(),
  }),
  // True/False
  questionBaseSchema.extend({
    question_type: z.literal('TRUE_FALSE'),
    question_text_en: z.record(z.any()),
    question_text_fr: z.record(z.any()).optional().nullable(),
    correct_answers: z.array(z.boolean()).length(1, 'True/False must have exactly one answer'),
    explanation_en: z.record(z.any()).optional().nullable(),
    explanation_fr: z.record(z.any()).optional().nullable(),
  }),
  // Short answer
  questionBaseSchema.extend({
    question_type: z.literal('SHORT_ANSWER'),
    question_text_en: z.record(z.any()),
    question_text_fr: z.record(z.any()).optional().nullable(),
    correct_answers: z.array(z.string()).min(1, 'At least one correct answer is required'),
    explanation_en: z.record(z.any()).optional().nullable(),
    explanation_fr: z.record(z.any()).optional().nullable(),
  }),
  // Fill in the blank
  questionBaseSchema.extend({
    question_type: z.literal('FILL_BLANK'),
    question_text_en: z.record(z.any()),
    question_text_fr: z.record(z.any()).optional().nullable(),
    correct_answers: z.array(z.string()).min(1, 'At least one correct answer is required'),
    explanation_en: z.record(z.any()).optional().nullable(),
    explanation_fr: z.record(z.any()).optional().nullable(),
  }),
  // Matching
  questionBaseSchema.extend({
    question_type: z.literal('MATCHING'),
    question_text_en: z.record(z.any()),
    question_text_fr: z.record(z.any()).optional().nullable(),
    options_en: z.array(
      z.object({
        id: z.string(),
        left: z.string(),
        right: z.string(),
      })
    ).min(2, 'At least 2 pairs are required'),
    options_fr: z.array(
      z.object({
        id: z.string(),
        left: z.string(),
        right: z.string(),
      })
    ).optional().nullable(),
    correct_answers: z.array(
      z.object({
        left_id: z.string(),
        right_id: z.string(),
      })
    ),
    explanation_en: z.record(z.any()).optional().nullable(),
    explanation_fr: z.record(z.any()).optional().nullable(),
  }),
]);

export const updateQuestionSchema = z.object({
  question_order: z.number().int().min(1).optional(),
  question_type: QuestionTypeSchema.optional(),
  question_text_en: z.record(z.any()).optional(),
  question_text_fr: z.record(z.any()).optional().nullable(),
  options_en: z.record(z.any()).optional().nullable(),
  options_fr: z.record(z.any()).optional().nullable(),
  correct_answers: z.record(z.any()).optional(),
  explanation_en: z.record(z.any()).optional().nullable(),
  explanation_fr: z.record(z.any()).optional().nullable(),
  points: z.number().int().min(1).optional(),
});

// Quiz submission schemas
export const startQuizSubmissionSchema = z.object({
  quiz_id: z.string().cuid('Invalid quiz ID'),
  student_id: z.string().cuid('Invalid student ID'),
});

export const submitQuizAnswerSchema = z.object({
  submission_id: z.string().cuid('Invalid submission ID'),
  question_id: z.string().cuid('Invalid question ID'),
  answer_given: z.record(z.any()), // Format varies by question type
});

export const completeQuizSubmissionSchema = z.object({
  submission_id: z.string().cuid('Invalid submission ID'),
  time_spent_seconds: z.number().int().min(0).optional(),
});

// Quiz query params schema
export const quizQuerySchema = z.object({
  lesson_id: z.string().cuid().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Quiz submission query params
export const quizSubmissionQuerySchema = z.object({
  quiz_id: z.string().cuid().optional(),
  student_id: z.string().cuid().optional(),
  passed: z.coerce.boolean().optional(),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort_by: z.enum(['submitted_at', 'score_percentage']).default('submitted_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports
export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type QuizConfig = z.infer<typeof quizConfigSchema>;
export type CreateQuiz = z.infer<typeof createQuizSchema>;
export type UpdateQuiz = z.infer<typeof updateQuizSchema>;
export type CreateQuestion = z.infer<typeof createQuestionSchema>;
export type UpdateQuestion = z.infer<typeof updateQuestionSchema>;
export type StartQuizSubmission = z.infer<typeof startQuizSubmissionSchema>;
export type SubmitQuizAnswer = z.infer<typeof submitQuizAnswerSchema>;
export type CompleteQuizSubmission = z.infer<typeof completeQuizSubmissionSchema>;
export type QuizQuery = z.infer<typeof quizQuerySchema>;
export type QuizSubmissionQuery = z.infer<typeof quizSubmissionQuerySchema>;
