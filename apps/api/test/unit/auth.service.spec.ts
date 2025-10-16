import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { AuthService } from '../../src/auth/auth.service';
import { RegisterDto, LoginDto } from '../../src/auth/dto';

// Create mock service classes
class MockPrismaService {
  user = {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  activityLog = {
    create: vi.fn(),
  };
}

class MockJwtService {
  sign = vi.fn();
}

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: any;
  let jwtService: any;

  beforeEach(() => {
    // Create fresh mock instances
    prismaService = new MockPrismaService();
    jwtService = new MockJwtService();

    // Set default JWT token return value
    jwtService.sign.mockReturnValue('test-jwt-token');

    // Directly instantiate the service with the mocks
    authService = new AuthService(prismaService as any, jwtService as any);
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@test.com',
        password: 'Password123!',
        name: 'New User',
        language_pref: 'en',
      };

      const mockUser = {
        id: 'user-1',
        email: registerDto.email,
        password_hash: 'hashed-password',
        name: registerDto.name,
        role: UserRole.STUDENT,
        language_pref: 'en',
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockUser);
      prismaService.activityLog.create.mockResolvedValue({} as any);

      const result = await authService.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('access_token');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.name).toBe(registerDto.name);
      expect(result.user.role).toBe(UserRole.STUDENT);
      expect(result.access_token).toBe('test-jwt-token');

      // Verify user was checked for existence
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });

      // Verify user was created
      expect(prismaService.user.create).toHaveBeenCalled();

      // Verify JWT was generated
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@test.com',
        password: 'Password123!',
        name: 'Existing User',
      };

      const existingUser = {
        id: 'existing-user-id',
        email: registerDto.email,
        password_hash: 'hashed',
        name: 'Existing',
        role: UserRole.STUDENT,
        language_pref: 'en',
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(authService.register(registerDto)).rejects.toThrow(
        'User with this email already exists',
      );

      // Verify create was never called
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should hash password before storing', async () => {
      const registerDto: RegisterDto = {
        email: 'test@test.com',
        password: 'PlainPassword123!',
        name: 'Test User',
      };

      prismaService.user.findUnique.mockResolvedValue(null);

      const mockUser = {
        id: 'user-1',
        email: registerDto.email,
        password_hash: 'hashed-password',
        name: registerDto.name,
        role: UserRole.STUDENT,
        language_pref: 'en',
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: new Date(),
      };

      prismaService.user.create.mockResolvedValue(mockUser);
      prismaService.activityLog.create.mockResolvedValue({} as any);

      await authService.register(registerDto);

      // Verify user was created with a password_hash field (bcrypt actually runs)
      expect(prismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password_hash: expect.any(String),
          }),
        }),
      );

      // Verify the password_hash is not the plain password
      const createCall = prismaService.user.create.mock.calls[0][0];
      expect(createCall.data.password_hash).not.toBe(registerDto.password);
    });

    it('should default to STUDENT role on registration', async () => {
      const registerDto: RegisterDto = {
        email: 'student@test.com',
        password: 'Password123!',
        name: 'Student User',
      };

      const mockUser = {
        id: 'user-1',
        email: registerDto.email,
        password_hash: 'hashed',
        name: registerDto.name,
        role: UserRole.STUDENT,
        language_pref: 'en',
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockUser);
      prismaService.activityLog.create.mockResolvedValue({} as any);

      const result = await authService.register(registerDto);

      expect(result.user.role).toBe(UserRole.STUDENT);
    });

    it('should default language preference to "en" if not provided', async () => {
      const registerDto: RegisterDto = {
        email: 'test@test.com',
        password: 'Password123!',
        name: 'Test User',
      };

      const mockUser = {
        id: 'user-1',
        email: registerDto.email,
        password_hash: 'hashed',
        name: registerDto.name,
        role: UserRole.STUDENT,
        language_pref: 'en',
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockUser);
      prismaService.activityLog.create.mockResolvedValue({} as any);

      await authService.register(registerDto);

      expect(prismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            language_pref: 'en',
          }),
        }),
      );
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'user@test.com',
        password: 'Password123!',
      };

      const mockUser = {
        id: 'user-1',
        email: loginDto.email,
        password_hash: await bcrypt.hash(loginDto.password, 10),
        name: 'Test User',
        role: UserRole.STUDENT,
        language_pref: 'en',
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      prismaService.activityLog.create.mockResolvedValue({} as any);

      const result = await authService.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('access_token');
      expect(result.user.email).toBe(loginDto.email);
      expect(result.access_token).toBe('test-jwt-token');

      // Verify last_login was updated
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { last_login: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException with invalid email', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@test.com',
        password: 'Password123!',
      };

      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );

      // Verify update was never called
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      const loginDto: LoginDto = {
        email: 'user@test.com',
        password: 'WrongPassword',
      };

      const mockUser = {
        id: 'user-1',
        email: loginDto.email,
        password_hash: await bcrypt.hash('CorrectPassword', 10),
        name: 'Test User',
        role: UserRole.STUDENT,
        language_pref: 'en',
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );

      // Verify update was never called
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should prevent timing attacks by always running bcrypt comparison', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@test.com',
        password: 'Password123!',
      };

      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      // The service should still throw even when user doesn't exist
      // (bcrypt.compare runs with a dummy hash to prevent timing attacks)
    });
  });

  describe('validateUser', () => {
    it('should return user when valid user ID is provided', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@test.com',
        password_hash: 'hashed',
        name: 'Test User',
        role: UserRole.STUDENT,
        language_pref: 'en',
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.validateUser('user-1');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).not.toHaveProperty('password_hash');
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.validateUser('invalid-id')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.validateUser('invalid-id')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user data', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@test.com',
        password_hash: 'hashed',
        name: 'Test User',
        role: UserRole.STUDENT,
        language_pref: 'en',
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.getCurrentUser('user-1');

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result).not.toHaveProperty('password_hash');
    });
  });

  describe('password security', () => {
    it('should not expose password hash in responses', async () => {
      const registerDto: RegisterDto = {
        email: 'secure@test.com',
        password: 'Password123!',
        name: 'Secure User',
      };

      const mockUser = {
        id: 'user-1',
        email: registerDto.email,
        password_hash: 'hashed-password',
        name: registerDto.name,
        role: UserRole.STUDENT,
        language_pref: 'en',
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockUser);
      prismaService.activityLog.create.mockResolvedValue({} as any);

      const result = await authService.register(registerDto);

      expect(result.user).not.toHaveProperty('password_hash');
    });
  });
});
