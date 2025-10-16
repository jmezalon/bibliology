import { Injectable } from '@nestjs/common';

import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getWelcome() {
    return {
      name: 'Bibliology API',
      version: '1.0.0',
      description: 'Backend API for Bibliology - Bilingual Bible Study Learning Platform',
      documentation: '/api/docs',
    };
  }
}
