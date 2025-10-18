// Global setup that runs once before all tests
export default function setup() {
  // Set environment variables for all test processes
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-only';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.DATABASE_URL =
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bibliology';
  process.env.REDIS_HOST = 'localhost';
  process.env.REDIS_PORT = '6379';
  process.env.PORT = '3001';
  process.env.API_PREFIX = 'api';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
}
