import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser, Roles } from '../auth/decorators';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserDto } from '../auth/dto';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get all users (Admin only)
   * GET /api/users?page=1&limit=10&role=STUDENT
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('role') role?: UserRole,
  ) {
    return this.usersService.findAll(page, limit, role);
  }

  /**
   * Get user statistics (Admin only)
   * GET /api/users/stats
   */
  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getStats() {
    return this.usersService.getStats();
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.usersService.findOne(id, user.id, user.role);
  }

  /**
   * Update user
   * PUT /api/users/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.usersService.update(id, updateUserDto, user.id, user.role);
  }

  /**
   * Delete user (Admin only)
   * DELETE /api/users/:id
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
