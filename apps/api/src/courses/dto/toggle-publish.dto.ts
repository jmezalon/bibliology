import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class TogglePublishDto {
  @ApiProperty({
    description: 'Set to true to publish the course, false to unpublish',
    example: true,
  })
  @IsBoolean({ message: 'Publish must be a boolean value (true or false)' })
  @IsNotEmpty({ message: 'Publish field is required' })
  publish: boolean;
}
