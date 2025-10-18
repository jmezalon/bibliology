import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import {
  EnrollmentsController,
  CourseEnrollmentsController,
} from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';

@Module({
  imports: [PrismaModule],
  controllers: [EnrollmentsController, CourseEnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
