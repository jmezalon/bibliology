import {
  GripVertical,
  Edit,
  Trash2,
  Eye,
  FileText,
  Clock,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

import { cn } from '../../lib/utils';
import type { Lesson } from '../../types/course';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';

interface LessonCardProps {
  lesson: Lesson;
  isDragging?: boolean;
  onEdit?: (lesson: Lesson) => void;
  onDelete?: (lesson: Lesson) => void;
  onView?: (lesson: Lesson) => void;
  onTogglePublish?: (lesson: Lesson) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function LessonCard({
  lesson,
  isDragging = false,
  onEdit,
  onDelete,
  onView,
  onTogglePublish,
  dragHandleProps,
}: LessonCardProps) {
  const slideCount = lesson._count?.slides || 0;

  return (
    <Card
      className={cn('lesson-card group transition-all', isDragging && 'opacity-50 shadow-lg')}
      role="article"
      aria-label={`Lesson: ${lesson.title_en}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded focus-ring"
            role="button"
            aria-label="Drag to reorder"
            tabIndex={0}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Order Number */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">{lesson.order}</span>
          </div>

          {/* Lesson Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">{lesson.title_en}</h4>
            <p className="text-sm text-muted-foreground truncate">{lesson.description_en}</p>
          </div>

          {/* Status Badge */}
          <div className="flex-shrink-0">
            <span
              className={cn(
                'px-2 py-1 text-xs font-medium rounded-full',
                lesson.is_published
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
              )}
              role="status"
            >
              {lesson.is_published ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1" title={`${slideCount} slides`}>
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span>{slideCount} slides</span>
            </div>
            <div className="flex items-center gap-1" title={`${lesson.duration_minutes} minutes`}>
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>{lesson.duration_minutes} min</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {onTogglePublish && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onTogglePublish(lesson)}
                title={lesson.is_published ? 'Unpublish' : 'Publish'}
                aria-label={lesson.is_published ? 'Unpublish lesson' : 'Publish lesson'}
              >
                {lesson.is_published ? (
                  <ToggleRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ToggleLeft className="h-4 w-4" />
                )}
              </Button>
            )}
            {onView && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onView(lesson)}
                aria-label="View lesson"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(lesson)}
                aria-label="Edit lesson"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onDelete(lesson)}
                aria-label="Delete lesson"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
