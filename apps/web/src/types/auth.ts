export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  language_pref: string;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  language_pref?: string;
}

export interface UpdateUserRequest {
  name?: string;
  avatar_url?: string;
  language_pref?: string;
}
