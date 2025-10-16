import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

export class SlideOrderItem {
  @ApiProperty({ description: 'Slide ID' })
  @IsString()
  @IsNotEmpty()
  slide_id: string;

  @ApiProperty({ description: 'New order position (0-based)' })
  @IsInt()
  @Min(0)
  order: number;
}

export class BulkReorderSlidesDto {
  @ApiProperty({
    description: 'Array of slide IDs with their new order positions',
    type: [SlideOrderItem],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SlideOrderItem)
  slide_orders: SlideOrderItem[];
}
