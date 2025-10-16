import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../src/prisma/prisma.service';
import { getTestJwtSecret } from './auth-helper';

/**
 * Create a test NestJS application
 */
export async function createTestApp(module: any): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule(module).compile();

  const app = moduleFixture.createNestApplication();

  // Apply same validation pipes as production
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}

/**
 * Get PrismaService from the testing module
 */
export function getPrismaService(app: INestApplication): PrismaService {
  return app.get<PrismaService>(PrismaService);
}

/**
 * Create a minimal test module with common dependencies
 */
export function createTestModule(imports: any[], providers: any[]) {
  return {
    imports: [
      ...imports,
      JwtModule.register({
        secret: getTestJwtSecret(),
        signOptions: { expiresIn: '7d' },
      }),
    ],
    providers: [PrismaService, ...providers],
  };
}

/**
 * Wait for a promise with timeout
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error('Timeout waiting for condition');
}

/**
 * Assert that a function throws an error with specific message
 */
export async function expectToThrow(
  fn: () => Promise<any>,
  expectedMessage?: string | RegExp,
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error: any) {
    if (expectedMessage) {
      if (typeof expectedMessage === 'string') {
        if (!error.message.includes(expectedMessage)) {
          throw new Error(
            `Expected error message to include "${expectedMessage}", but got "${error.message}"`,
          );
        }
      } else {
        if (!expectedMessage.test(error.message)) {
          throw new Error(
            `Expected error message to match ${expectedMessage}, but got "${error.message}"`,
          );
        }
      }
    }
  }
}

/**
 * Generate random email for testing
 */
export function randomEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate random slug for testing
 */
export function randomSlug(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract cookies from response headers
 */
export function extractCookie(response: any, cookieName: string): string | undefined {
  const cookies = response.headers['set-cookie'];
  if (!cookies) return undefined;

  const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
  const cookie = cookieArray.find((c: string) => c.startsWith(`${cookieName}=`));

  if (!cookie) return undefined;

  const match = cookie.match(new RegExp(`${cookieName}=([^;]+)`));
  return match ? match[1] : undefined;
}
