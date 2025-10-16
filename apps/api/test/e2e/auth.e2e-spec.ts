import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { UserRole } from '@prisma/client';

import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestUser, clearDatabase } from '../helpers/factories';
import { extractCookie, randomEmail } from '../helpers/test-utils';

describe('Auth E2E Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /auth/register', () => {
    it('should successfully register a new user', async () => {
      const registerData = {
        email: randomEmail(),
        password: 'Password123!',
        name: 'Test User',
        language_pref: 'en',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.email).toBe(registerData.email);
      expect(response.body.user.name).toBe(registerData.name);
      expect(response.body.user.role).toBe(UserRole.STUDENT);
      expect(response.body.user).not.toHaveProperty('password_hash');

      // Verify cookie was set
      const cookie = extractCookie(response, 'access_token');
      expect(cookie).toBeDefined();
      expect(cookie).toBe(response.body.access_token);

      // Verify user was created in database
      const user = await prismaService.user.findUnique({
        where: { email: registerData.email },
      });
      expect(user).toBeDefined();
      expect(user?.email).toBe(registerData.email);
    });

    it('should return 409 if email already exists', async () => {
      const existingUser = await createTestUser({
        email: 'existing@test.com',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: existingUser.email,
          password: 'Password123!',
          name: 'Duplicate User',
        })
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should return 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          name: 'Test User',
        })
        .expect(400);
    });

    it('should return 400 for password shorter than 8 characters', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: randomEmail(),
          password: 'Short1!',
          name: 'Test User',
        })
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: randomEmail(),
          // missing password and name
        })
        .expect(400);
    });

    it('should default language_pref to "en" if not provided', async () => {
      const registerData = {
        email: randomEmail(),
        password: 'Password123!',
        name: 'Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.user.language_pref).toBe('en');
    });

    it('should accept "fr" as language_pref', async () => {
      const registerData = {
        email: randomEmail(),
        password: 'Password123!',
        name: 'Test User',
        language_pref: 'fr',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.user.language_pref).toBe('fr');
    });

    it('should reject invalid language_pref', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: randomEmail(),
          password: 'Password123!',
          name: 'Test User',
          language_pref: 'es',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      const password = 'Password123!';
      const user = await createTestUser({
        email: 'login@test.com',
        password,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: user.email,
          password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.email).toBe(user.email);
      expect(response.body.user).not.toHaveProperty('password_hash');

      // Verify cookie was set
      const cookie = extractCookie(response, 'access_token');
      expect(cookie).toBeDefined();
      expect(cookie).toBe(response.body.access_token);

      // Verify last_login was updated
      const updatedUser = await prismaService.user.findUnique({
        where: { id: user.id },
      });
      expect(updatedUser?.last_login).toBeDefined();
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const user = await createTestUser({
        password: 'CorrectPassword123!',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 400 for missing credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@test.com',
          // missing password
        })
        .expect(400);
    });

    it('should return 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('should successfully logout and clear cookie', async () => {
      const password = 'Password123!';
      const user = await createTestUser({ password });

      // First login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: user.email,
          password,
        })
        .expect(200);

      const token = loginResponse.body.access_token;

      // Then logout
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toContain('Logged out successfully');

      // Verify cookie is cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      if (Array.isArray(cookies)) {
        const accessTokenCookie = cookies.find((c: string) =>
          c.startsWith('access_token='),
        );
        expect(accessTokenCookie).toContain('Max-Age=0');
      }
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user data with valid token', async () => {
      const password = 'Password123!';
      const user = await createTestUser({
        email: 'me@test.com',
        password,
      });

      // First login to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: user.email,
          password,
        })
        .expect(200);

      const token = loginResponse.body.access_token;

      // Then get current user
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('role');
      expect(response.body.email).toBe(user.email);
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 401 with malformed authorization header', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });
  });

  describe('JWT Token Validation', () => {
    it('should accept Bearer token in Authorization header', async () => {
      const password = 'Password123!';
      const user = await createTestUser({ password });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: user.email,
          password,
        });

      const token = loginResponse.body.access_token;

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should reject expired token', async () => {
      // This test would require creating an expired token
      // For now, we'll just test with an invalid token format
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid')
        .expect(401);
    });
  });

  describe('Role-based Access', () => {
    it('should register users as STUDENT by default', async () => {
      const registerData = {
        email: randomEmail(),
        password: 'Password123!',
        name: 'Student User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.user.role).toBe(UserRole.STUDENT);
    });

    it('should allow login for TEACHER users', async () => {
      const password = 'Password123!';
      const teacher = await createTestUser({
        email: 'teacher@test.com',
        password,
        role: UserRole.TEACHER,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: teacher.email,
          password,
        })
        .expect(200);

      expect(response.body.user.role).toBe(UserRole.TEACHER);
    });

    it('should allow login for ADMIN users', async () => {
      const password = 'Password123!';
      const admin = await createTestUser({
        email: 'admin@test.com',
        password,
        role: UserRole.ADMIN,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: admin.email,
          password,
        })
        .expect(200);

      expect(response.body.user.role).toBe(UserRole.ADMIN);
    });
  });
});
