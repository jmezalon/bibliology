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

export class BlockOrderItem {
  @ApiProperty({ description: 'Content block ID' })
  @IsString()
  @IsNotEmpty()
  block_id: string;

  @ApiProperty({ description: 'New order position (0-based)' })
  @IsInt()
  @Min(0)
  order: number;
}

export class ReorderContentBlocksDto {
  @ApiProperty({
    description: 'Array of block IDs with their new order positions',
    type: [BlockOrderItem],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BlockOrderItem)
  block_orders: BlockOrderItem[];
}
