import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';

import { RegisterDto, LoginDto, AuthResponseDto, UserDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name, language_pref } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user with last_login set on creation
    const user = await this.prisma.user.create({
      data: {
        email,
        password_hash,
        name,
        role: UserRole.STUDENT, // Always STUDENT on registration
        language_pref: language_pref || 'en',
        last_login: new Date(),
      },
    });

    // Generate JWT token
    const access_token = this.generateToken(user);

    // Log activity (fire-and-forget)
    this.logActivity(user.id, 'REGISTER').catch((error) => {
      this.logger.error('Failed to log registration activity', error);
    });

    this.logger.log(`New user registered: ${user.id}`);

    return {
      user: this.sanitizeUser(user),
      access_token,
    };
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always run bcrypt comparison even if user not found (prevent timing attacks)
    const passwordToCompare = user?.password_hash || '$2b$10$invalidhashtopreventtimingattacks1234567890123456';
    const isPasswordValid = await bcrypt.compare(password, passwordToCompare);

    if (!user || !isPasswordValid) {
      this.logger.warn(`Failed login attempt for email: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    // Generate JWT token
    const access_token = this.generateToken(user);

    // Log activity (fire-and-forget)
    this.logActivity(user.id, 'LOGIN').catch((error) => {
      this.logger.error('Failed to log login activity', error);
    });

    this.logger.log(`Successful login for user: ${user.id}`);

    return {
      user: this.sanitizeUser(user),
      access_token,
    };
  }

  /**
   * Validate user by ID (used by JWT strategy)
   */
  async validateUser(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string): Promise<UserDto> {
    return this.validateUser(userId);
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Sanitize user (remove sensitive data)
   */
  private sanitizeUser(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      language_pref: user.language_pref,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login,
    };
  }

  /**
   * Log user activity (non-critical operation)
   */
  private async logActivity(userId: string, action: string): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          user_id: userId,
          action,
        },
      });
    } catch (error) {
      // Log error but don't throw - activity logging is non-critical
      this.logger.error('Failed to log activity', error);
    }
  }
}
