import { z } from 'zod';

// Enums
export const UserRoleSchema = z.enum(['STUDENT', 'TEACHER', 'ADMIN']);

// User registration schema
export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  role: UserRoleSchema.default('STUDENT'),
  language_pref: z.enum(['en', 'fr']).default('en'),
});

// User login schema
export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Update user profile schema
export const userUpdateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .optional(),
  avatar_url: z.string().url('Invalid avatar URL').nullable().optional(),
  language_pref: z.enum(['en', 'fr']).optional(),
});

// Update user password schema
export const userUpdatePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),
});

// Admin update user schema
export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: UserRoleSchema.optional(),
  avatar_url: z.string().url().nullable().optional(),
  language_pref: z.enum(['en', 'fr']).optional(),
});

// User query params schema
export const userQuerySchema = z.object({
  role: UserRoleSchema.optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Type exports
export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserUpdateProfile = z.infer<typeof userUpdateProfileSchema>;
export type UserUpdatePassword = z.infer<typeof userUpdatePasswordSchema>;
export type AdminUpdateUser = z.infer<typeof adminUpdateUserSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
