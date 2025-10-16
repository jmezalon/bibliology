import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { LessonsController, CourseLessonsController } from './lessons.controller';
import { CoursesService } from './courses.service';
import { LessonsService } from './lessons.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CoursesController, LessonsController, CourseLessonsController],
  providers: [CoursesService, LessonsService],
  exports: [CoursesService, LessonsService],
})
export class CoursesModule {}
