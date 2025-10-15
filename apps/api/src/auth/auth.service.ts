import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto, AuthResponseDto, UserDto } from './dto';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name, role, language_pref } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password_hash,
        name,
        role: role || UserRole.STUDENT,
        language_pref: language_pref || 'en',
      },
    });

    // Generate JWT token
    const access_token = this.generateToken(user);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    // Log activity
    await this.logActivity(user.id, 'REGISTER');

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

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const access_token = this.generateToken(user);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    // Log activity
    await this.logActivity(user.id, 'LOGIN');

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

    return this.sanitizeUserFull(user);
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
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Sanitize user (remove sensitive data) - minimal version
   */
  private sanitizeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      language_pref: user.language_pref,
      avatar_url: user.avatar_url,
    };
  }

  /**
   * Sanitize user (remove sensitive data) - full version
   */
  private sanitizeUserFull(user: User): UserDto {
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
   * Log user activity
   */
  private async logActivity(userId: string, action: string) {
    await this.prisma.activityLog.create({
      data: {
        user_id: userId,
        action,
      },
    });
  }
}
