import { IsString, IsOptional, MinLength, MaxLength, IsEnum, IsUrl, IsIn } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @IsOptional()
  @MaxLength(500)
  avatar_url?: string;

  @IsString()
  @IsOptional()
  @IsIn(['en', 'fr'])
  language_pref?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
