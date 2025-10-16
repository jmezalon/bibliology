import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { LessonsController, CourseLessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';

@Module({
  imports: [PrismaModule],
  controllers: [CoursesController, LessonsController, CourseLessonsController],
  providers: [CoursesService, LessonsService],
  exports: [CoursesService, LessonsService],
})
export class CoursesModule {}
