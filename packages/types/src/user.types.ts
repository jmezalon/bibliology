// User-related types for Bibliology LMS

export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  avatar_url: string | null;
  language_pref: string; // 'en' or 'fr'
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url: string | null;
  language_pref: string;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  language_pref?: string;
  avatar_url?: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: UserRole;
  language_pref?: string;
  avatar_url?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserDto;
  token: string;
}
