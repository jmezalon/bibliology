import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@example.com',
          name: 'User 1',
          role: UserRole.STUDENT,
          language_pref: 'en',
          avatar_url: null,
          created_at: new Date(),
          updated_at: new Date(),
          last_login: new Date(),
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        users: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            email: 'user1@example.com',
          }),
        ]),
        total: 1,
      });
      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(prisma.user.count).toHaveBeenCalled();
    });

    it('should filter users by role', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.findAll(1, 10, UserRole.TEACHER);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: UserRole.TEACHER },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return user when found and user is viewing own profile', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.STUDENT,
        language_pref: 'en',
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('1', '1', UserRole.STUDENT);

      expect(result).toEqual(expect.objectContaining({
        id: '1',
        email: 'user@example.com',
      }));
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('999', '1', UserRole.STUDENT),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when non-admin tries to view other user', async () => {
      const mockUser = {
        id: '2',
        email: 'other@example.com',
        role: UserRole.STUDENT,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.findOne('2', '1', UserRole.STUDENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to view any user', async () => {
      const mockUser = {
        id: '2',
        email: 'other@example.com',
        name: 'Other User',
        role: UserRole.STUDENT,
        language_pref: 'en',
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('2', '1', UserRole.ADMIN);

      expect(result).toEqual(expect.objectContaining({
        id: '2',
        email: 'other@example.com',
      }));
    });
  });

  describe('update', () => {
    it('should update user when user updates own profile', async () => {
      const updateDto = { name: 'Updated Name' };
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Old Name',
        role: UserRole.STUDENT,
      };
      const updatedUser = { ...mockUser, name: 'Updated Name' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      await service.update('1', updateDto, '1', UserRole.STUDENT);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateDto,
      });
    });

    it('should throw ForbiddenException when non-admin tries to change role', async () => {
      const updateDto = { role: UserRole.ADMIN };
      const mockUser = {
        id: '1',
        role: UserRole.STUDENT,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.update('1', updateDto, '1', UserRole.STUDENT),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete user when found', async () => {
      const mockUser = { id: '1', email: 'user@example.com' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove('1');

      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return user statistics', async () => {
      mockPrismaService.user.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(75) // students
        .mockResolvedValueOnce(20) // teachers
        .mockResolvedValueOnce(5); // admins

      const result = await service.getStats();

      expect(result).toEqual({
        totalUsers: 100,
        totalStudents: 75,
        totalTeachers: 20,
        totalAdmins: 5,
      });
    });
  });
});
