import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { LessonsController, CourseLessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { ContentBlocksController, SlideContentBlocksController } from './slides/content-blocks.controller';
import { ContentBlocksService } from './slides/content-blocks.service';
import { SlidesController, LessonSlidesController } from './slides/slides.controller';
import { SlidesService } from './slides/slides.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    CoursesController,
    LessonsController,
    CourseLessonsController,
    SlidesController,
    LessonSlidesController,
    ContentBlocksController,
    SlideContentBlocksController,
  ],
  providers: [CoursesService, LessonsService, SlidesService, ContentBlocksService],
  exports: [CoursesService, LessonsService, SlidesService, ContentBlocksService],
})
export class CoursesModule {}
