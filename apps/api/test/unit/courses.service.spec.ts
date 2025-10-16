import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { LessonStatus } from '@prisma/client';

import { CoursesService } from '../../src/courses/courses.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from '../../src/courses/dto';

// Create a mock Prisma class
class MockPrismaService {
  course = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  };
  lesson = {
    count: vi.fn(),
  };
  enrollment = {
    count: vi.fn(),
  };
  $connect = vi.fn();
  $disconnect = vi.fn();
  onModuleInit = vi.fn();
  onModuleDestroy = vi.fn();
}

describe('CoursesService', () => {
  let coursesService: CoursesService;
  let prismaService: any; // Use any to avoid type issues with mocks

  const mockTeacher = {
    id: 'teacher-1',
    name: 'Test Teacher',
    email: 'teacher@test.com',
    avatar_url: null,
  };

  const mockCourse = {
    id: 'course-1',
    slug: 'test-course',
    teacher_id: 'teacher-1',
    title_en: 'Test Course',
    title_fr: 'Cours de Test',
    description_en: 'Test description',
    description_fr: 'Description de test',
    thumbnail_url: null,
    cover_image_url: null,
    status: LessonStatus.DRAFT,
    category: 'Biblical Studies',
    tags: ['test'],
    estimated_hours: 10,
    difficulty: 'Beginner',
    created_at: new Date(),
    updated_at: new Date(),
    published_at: null,
    teacher: mockTeacher,
    _count: {
      lessons: 0,
      enrollments: 0,
    },
  };

  beforeEach(async () => {
    // Create a fresh mock instance
    prismaService = new MockPrismaService();

    // Directly instantiate the service with the mock
    coursesService = new CoursesService(prismaService as any);
  });

  describe('create', () => {
    it('should successfully create a course', async () => {
      const createDto: CreateCourseDto = {
        slug: 'new-course',
        title_en: 'New Course',
        description_en: 'Course description',
        status: LessonStatus.DRAFT,
      };

      prismaService.course.findUnique.mockResolvedValue(null);
      prismaService.course.create.mockResolvedValue(mockCourse);

      const result = await coursesService.create('teacher-1', createDto);

      expect(result).toHaveProperty('id');
      expect(result.slug).toBe(mockCourse.slug);
      expect(result.teacher_id).toBe('teacher-1');

      // Verify slug uniqueness was checked
      expect(prismaService.course.findUnique).toHaveBeenCalledWith({
        where: { slug: createDto.slug },
      });

      // Verify course was created
      expect(prismaService.course.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if slug already exists', async () => {
      const createDto: CreateCourseDto = {
        slug: 'existing-slug',
        title_en: 'New Course',
        description_en: 'Description',
      };

      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue(mockCourse);

      await expect(
        coursesService.create('teacher-1', createDto),
      ).rejects.toThrow(ConflictException);
      await expect(
        coursesService.create('teacher-1', createDto),
      ).rejects.toThrow("Course with slug 'existing-slug' already exists");

      // Verify create was never called
      expect(prismaService.course.create).not.toHaveBeenCalled();
    });

    it('should accept optional fields', async () => {
      const createDto: CreateCourseDto = {
        slug: 'minimal-course',
        title_en: 'Minimal Course',
        description_en: 'Description',
        tags: ['tag1', 'tag2'],
        estimated_hours: 5,
        difficulty: 'Advanced',
      };

      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prismaService.course, 'create').mockResolvedValue({
        ...mockCourse,
        ...createDto,
      });

      const result = await coursesService.create('teacher-1', createDto);

      expect(result.tags).toEqual(['tag1', 'tag2']);
      expect(result.estimated_hours).toBe(5);
      expect(result.difficulty).toBe('Advanced');
    });
  });

  describe('findAllForTeacher', () => {
    it('should return paginated list of courses for teacher', async () => {
      const courses = [mockCourse];

      vi.spyOn(prismaService.course, 'findMany').mockResolvedValue(courses);
      vi.spyOn(prismaService.course, 'count').mockResolvedValue(1);

      const result = await coursesService.findAllForTeacher('teacher-1', 1, 10);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('totalPages');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);

      // Verify query was filtered by teacher
      expect(prismaService.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teacher_id: 'teacher-1' },
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      const courses = Array(5)
        .fill(null)
        .map((_, i) => ({
          ...mockCourse,
          id: `course-${i}`,
          slug: `course-${i}`,
        }));

      vi.spyOn(prismaService.course, 'findMany').mockResolvedValue(courses);
      vi.spyOn(prismaService.course, 'count').mockResolvedValue(15);

      const result = await coursesService.findAllForTeacher('teacher-1', 2, 5);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(15);
      expect(result.totalPages).toBe(3);

      // Verify skip/take was calculated correctly
      expect(prismaService.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page 2 - 1) * 5
          take: 5,
        }),
      );
    });

    it('should return empty list if teacher has no courses', async () => {
      vi.spyOn(prismaService.course, 'findMany').mockResolvedValue([]);
      vi.spyOn(prismaService.course, 'count').mockResolvedValue(0);

      const result = await coursesService.findAllForTeacher('teacher-1', 1, 10);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should order by created_at descending', async () => {
      vi.spyOn(prismaService.course, 'findMany').mockResolvedValue([]);
      vi.spyOn(prismaService.course, 'count').mockResolvedValue(0);

      await coursesService.findAllForTeacher('teacher-1', 1, 10);

      expect(prismaService.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { created_at: 'desc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return course by ID', async () => {
      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue(mockCourse);

      const result = await coursesService.findOne('course-1');

      expect(result).toHaveProperty('id');
      expect(result.id).toBe('course-1');

      expect(prismaService.course.findUnique).toHaveBeenCalledWith({
        where: { id: 'course-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if course does not exist', async () => {
      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue(null);

      await expect(coursesService.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(coursesService.findOne('invalid-id')).rejects.toThrow(
        "Course with ID 'invalid-id' not found",
      );
    });

    it('should verify ownership if teacherId is provided', async () => {
      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue(mockCourse);

      const result = await coursesService.findOne('course-1', 'teacher-1');

      expect(result.id).toBe('course-1');
    });

    it('should throw ForbiddenException if teacher does not own course', async () => {
      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue(mockCourse);

      await expect(
        coursesService.findOne('course-1', 'other-teacher'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        coursesService.findOne('course-1', 'other-teacher'),
      ).rejects.toThrow('You do not have permission to access this course');
    });
  });

  describe('update', () => {
    it('should successfully update a course', async () => {
      const updateDto: UpdateCourseDto = {
        title_en: 'Updated Course Title',
        description_en: 'Updated description',
      };

      const updatedCourse = {
        ...mockCourse,
        ...updateDto,
      };

      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue(mockCourse);
      vi.spyOn(prismaService.course, 'update').mockResolvedValue(updatedCourse);

      const result = await coursesService.update(
        'course-1',
        'teacher-1',
        updateDto,
      );

      expect(result.title_en).toBe('Updated Course Title');

      expect(prismaService.course.update).toHaveBeenCalledWith({
        where: { id: 'course-1' },
        data: updateDto,
        include: expect.any(Object),
      });
    });

    it('should throw ForbiddenException if teacher does not own course', async () => {
      const updateDto: UpdateCourseDto = {
        title_en: 'Unauthorized Update',
      };

      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue(mockCourse);

      await expect(
        coursesService.update('course-1', 'other-teacher', updateDto),
      ).rejects.toThrow(ForbiddenException);

      expect(prismaService.course.update).not.toHaveBeenCalled();
    });

    it('should check slug uniqueness when updating slug', async () => {
      const updateDto: UpdateCourseDto = {
        slug: 'new-unique-slug',
      };

      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue(mockCourse);
      vi.spyOn(prismaService.course, 'findFirst').mockResolvedValue(null);
      vi.spyOn(prismaService.course, 'update').mockResolvedValue({
        ...mockCourse,
        ...updateDto,
      });

      await coursesService.update('course-1', 'teacher-1', updateDto);

      // Verify slug uniqueness was checked
      expect(prismaService.course.findFirst).toHaveBeenCalledWith({
        where: {
          slug: 'new-unique-slug',
          NOT: { id: 'course-1' },
        },
      });
    });

    it('should throw ConflictException if new slug is already taken', async () => {
      const updateDto: UpdateCourseDto = {
        slug: 'existing-slug',
      };

      const otherCourse = {
        ...mockCourse,
        id: 'other-course',
        slug: 'existing-slug',
      };

      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue(mockCourse);
      vi.spyOn(prismaService.course, 'findFirst').mockResolvedValue(otherCourse);

      await expect(
        coursesService.update('course-1', 'teacher-1', updateDto),
      ).rejects.toThrow(ConflictException);
      await expect(
        coursesService.update('course-1', 'teacher-1', updateDto),
      ).rejects.toThrow("Course with slug 'existing-slug' already exists");

      expect(prismaService.course.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should successfully delete a course with no active enrollments', async () => {
      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue(mockCourse);
      vi.spyOn(prismaService.enrollment, 'count').mockResolvedValue(0);
      vi.spyOn(prismaService.course, 'delete').mockResolvedValue(mockCourse);

      await coursesService.remove('course-1', 'teacher-1');

      expect(prismaService.course.delete).toHaveBeenCalledWith({
        where: { id: 'course-1' },
      });
    });

    it('should throw ForbiddenException if teacher does not own course', async () => {
      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue(mockCourse);

      await expect(
        coursesService.remove('course-1', 'other-teacher'),
      ).rejects.toThrow(ForbiddenException);

      expect(prismaService.course.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if course has active enrollments', async () => {
      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue(mockCourse);
      vi.spyOn(prismaService.enrollment, 'count').mockResolvedValue(5);

      await expect(
        coursesService.remove('course-1', 'teacher-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        coursesService.remove('course-1', 'teacher-1'),
      ).rejects.toThrow(
        'Cannot delete course with 5 active enrollment(s). Archive the course instead.',
      );

      expect(prismaService.course.delete).not.toHaveBeenCalled();
    });
  });

  describe('togglePublish', () => {
    it('should successfully publish a course with lessons', async () => {
      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue(mockCourse);
      vi.spyOn(prismaService.lesson, 'count').mockResolvedValue(3);
      vi.spyOn(prismaService.course, 'update').mockResolvedValue({
        ...mockCourse,
        status: LessonStatus.PUBLISHED,
        published_at: new Date(),
      });

      const result = await coursesService.togglePublish(
        'course-1',
        'teacher-1',
        true,
      );

      expect(result.status).toBe(LessonStatus.PUBLISHED);
      expect(result.published_at).toBeDefined();

      expect(prismaService.course.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'course-1' },
          data: {
            status: LessonStatus.PUBLISHED,
            published_at: expect.any(Date),
          },
        }),
      );
    });

    it('should throw BadRequestException when publishing course without lessons', async () => {
      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue(mockCourse);
      vi.spyOn(prismaService.lesson, 'count').mockResolvedValue(0);

      await expect(
        coursesService.togglePublish('course-1', 'teacher-1', true),
      ).rejects.toThrow(BadRequestException);
      await expect(
        coursesService.togglePublish('course-1', 'teacher-1', true),
      ).rejects.toThrow('Cannot publish a course without any lessons');

      expect(prismaService.course.update).not.toHaveBeenCalled();
    });

    it('should successfully unpublish a course', async () => {
      const publishedCourse = {
        ...mockCourse,
        status: LessonStatus.PUBLISHED,
        published_at: new Date(),
      };

      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue(publishedCourse);
      vi.spyOn(prismaService.course, 'update').mockResolvedValue({
        ...publishedCourse,
        status: LessonStatus.DRAFT,
        published_at: null,
      });

      const result = await coursesService.togglePublish(
        'course-1',
        'teacher-1',
        false,
      );

      expect(result.status).toBe(LessonStatus.DRAFT);
      expect(result.published_at).toBeNull();

      expect(prismaService.course.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            status: LessonStatus.DRAFT,
            published_at: null,
          },
        }),
      );
    });

    it('should throw ForbiddenException if teacher does not own course', async () => {
      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue(mockCourse);

      await expect(
        coursesService.togglePublish('course-1', 'other-teacher', true),
      ).rejects.toThrow(ForbiddenException);

      expect(prismaService.course.update).not.toHaveBeenCalled();
    });
  });

  describe('verifyOwnership', () => {
    it('should return true if teacher owns the course', async () => {
      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue({
        id: 'course-1',
        teacher_id: 'teacher-1',
      } as any);

      const result = await coursesService.verifyOwnership(
        'course-1',
        'teacher-1',
      );

      expect(result).toBe(true);
    });

    it('should throw NotFoundException if course does not exist', async () => {
      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue(null);

      await expect(
        coursesService.verifyOwnership('invalid-id', 'teacher-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if teacher does not own course', async () => {
      vi.spyOn(prismaService.course, 'findUnique').mockResolvedValue({
        id: 'course-1',
        teacher_id: 'teacher-1',
      } as any);

      await expect(
        coursesService.verifyOwnership('course-1', 'other-teacher'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
