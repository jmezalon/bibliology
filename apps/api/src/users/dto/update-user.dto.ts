import { IsString, IsOptional, MinLength, MaxLength, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;

  @IsString()
  @IsOptional()
  language_pref?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
