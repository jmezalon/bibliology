import { Edit, Trash2, Eye, Users, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '../../lib/utils';
import type { Course } from '../../types/course';
import { CourseLevel } from '../../types/course';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';

interface CourseCardProps {
  course: Course;
  onEdit?: (course: Course) => void;
  onDelete?: (course: Course) => void;
  onView?: (course: Course) => void;
}

export function CourseCard({ course, onEdit, onDelete, onView }: CourseCardProps) {
  const lessonCount = course._count?.lessons || 0;
  const studentCount = course._count?.enrollments || 0;

  return (
    <Card className="course-card group card-hover">
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden rounded-t-lg bg-muted">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title_en}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-muted-foreground opacity-50" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={cn(
              'px-2 py-1 text-xs font-medium rounded-full',
              course.is_published
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
            )}
            role="status"
            aria-label={course.is_published ? 'Published' : 'Draft'}
          >
            {course.is_published ? 'Published' : 'Draft'}
          </span>
        </div>

        {/* Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1 bg-background/95 backdrop-blur rounded-md p-1">
            {onView && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onView(course)}
                aria-label="View course"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(course)}
                aria-label="Edit course"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onDelete(course)}
                aria-label="Delete course"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight truncate">
              <Link
                to={`/teacher/courses/${course.id}`}
                className="hover:text-primary transition-colors focus-ring rounded"
              >
                {course.title_en}
              </Link>
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {course.description_en}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1" title={`${lessonCount} lessons`}>
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span>{lessonCount}</span>
          </div>
          <div className="flex items-center gap-1" title={`${studentCount} students`}>
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>{studentCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={cn(
                'px-2 py-0.5 text-xs rounded-full',
                course.level === CourseLevel.BEGINNER && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
                course.level === CourseLevel.INTERMEDIATE && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
                course.level === CourseLevel.ADVANCED && 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
              )}
            >
              {course.level}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <p className="text-xs text-muted-foreground">
          Updated {new Date(course.updated_at).toLocaleDateString()}
        </p>
      </CardFooter>
    </Card>
  );
}
