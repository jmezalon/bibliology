import { PartialType, OmitType } from '@nestjs/swagger';

import { CreateSlideDto } from './create-slide.dto';

// Omit lesson_id since we can't change a slide's lesson via update
// (use moveSlideToLesson operation instead)
export class UpdateSlideDto extends PartialType(OmitType(CreateSlideDto, ['lesson_id'] as const)) {}
