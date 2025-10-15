import { UserRole } from '@prisma/client';

export interface AuthResponseDto {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    language_pref: string;
    avatar_url: string | null;
  };
  access_token: string;
}

export interface UserDto {
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
