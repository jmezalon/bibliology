import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

/**
 * Generate JWT token for testing
 */
export function generateAuthToken(
  jwtService: JwtService,
  userId: string,
  email: string,
  role: UserRole,
): string {
  const payload = {
    sub: userId,
    email,
    role,
  };
  return jwtService.sign(payload);
}

/**
 * Make an authenticated request helper
 */
export interface AuthenticatedRequestOptions {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  url: string;
  token: string;
  body?: any;
  query?: Record<string, any>;
}

export function authenticatedRequest(
  app: INestApplication,
  options: AuthenticatedRequestOptions,
) {
  const req = request(app.getHttpServer())[options.method](options.url)
    .set('Authorization', `Bearer ${options.token}`)
    .set('Accept', 'application/json');

  if (options.body) {
    req.send(options.body);
  }

  if (options.query) {
    req.query(options.query);
  }

  return req;
}

/**
 * Get JWT secret for testing (should match your app config)
 */
export function getTestJwtSecret(): string {
  return process.env.JWT_SECRET || 'test-jwt-secret-key-change-in-production';
}

/**
 * Create a test JWT service
 */
export function createTestJwtService(): JwtService {
  return new JwtService({
    secret: getTestJwtSecret(),
    signOptions: { expiresIn: '7d' },
  });
}
