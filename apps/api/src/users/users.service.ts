import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from '../auth/dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all users (Admin only)
   */
  async findAll(page: number = 1, limit: number = 10, role?: UserRole): Promise<{ users: UserDto[]; total: number }> {
    const skip = (page - 1) * limit;

    const where = role ? { role } : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map(this.sanitizeUser),
      total,
    };
  }

  /**
   * Get user by ID
   */
  async findOne(id: string, requestingUserId: string, requestingUserRole: UserRole): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only allow users to view their own profile unless they're an admin
    if (id !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only view your own profile');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Update user
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ): Promise<UserDto> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only allow users to update their own profile unless they're an admin
    if (id !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Only admins can change roles
    if (updateUserDto.role && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can change user roles');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    return this.sanitizeUser(updatedUser);
  }

  /**
   * Delete user (Admin only)
   */
  async remove(id: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  /**
   * Get user statistics (for admin dashboard)
   */
  async getStats(): Promise<{
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalAdmins: number;
  }> {
    const [totalUsers, totalStudents, totalTeachers, totalAdmins] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: UserRole.STUDENT } }),
      this.prisma.user.count({ where: { role: UserRole.TEACHER } }),
      this.prisma.user.count({ where: { role: UserRole.ADMIN } }),
    ]);

    return {
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
    };
  }

  /**
   * Sanitize user (remove sensitive data)
   */
  private sanitizeUser(user: any): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      language_pref: user.language_pref,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login,
    };
  }
}
