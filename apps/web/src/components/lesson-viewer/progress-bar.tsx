import { Clock, CheckCircle2 } from 'lucide-react';

import { cn } from '../../lib/utils';

interface ProgressBarProps {
  currentSlide: number;
  totalSlides: number;
  viewedSlides: Set<number>;
  timeSpent?: number; // in seconds
  estimatedDuration?: number; // in minutes
}

/**
 * ProgressBar
 * Shows lesson progress and statistics
 */
export function ProgressBar({
  currentSlide,
  totalSlides,
  viewedSlides,
  timeSpent = 0,
  estimatedDuration,
}: ProgressBarProps) {
  const progressPercentage = ((currentSlide + 1) / totalSlides) * 100;
  const viewedPercentage = (viewedSlides.size / totalSlides) * 100;
  const allSlidesViewed = viewedSlides.size === totalSlides;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center justify-between mb-2">
        {/* Slide Counter */}
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Slide {currentSlide + 1} of {totalSlides}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          {/* Time Spent */}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatTime(timeSpent)}</span>
            {estimatedDuration && (
              <span className="text-xs text-gray-500">/ {estimatedDuration} min</span>
            )}
          </div>

          {/* Completion Status */}
          <div
            className={cn(
              'flex items-center gap-1',
              allSlidesViewed && 'text-green-600 dark:text-green-500',
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {viewedSlides.size}/{totalSlides} viewed
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        {/* Viewed Progress (lighter) */}
        <div
          className="absolute top-0 left-0 h-full bg-blue-300 dark:bg-blue-700 transition-all duration-300"
          style={{ width: `${viewedPercentage}%` }}
        />

        {/* Current Progress (darker) */}
        <div
          className="absolute top-0 left-0 h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
