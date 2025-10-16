import { PartialType, OmitType } from '@nestjs/swagger';

import { CreateContentBlockDto } from './create-content-block.dto';

// Omit slide_id and type since they shouldn't change after creation
export class UpdateContentBlockDto extends PartialType(
  OmitType(CreateContentBlockDto, ['slide_id', 'type'] as const),
) {}
