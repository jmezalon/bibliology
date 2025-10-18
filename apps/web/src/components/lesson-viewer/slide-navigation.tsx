import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

interface SlideNavigationProps {
  currentSlide: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  onSlideSelect: (slideIndex: number) => void;
}

/**
 * SlideNavigation
 * Navigation controls for moving between slides
 */
export function SlideNavigation({
  currentSlide,
  totalSlides,
  onPrevious,
  onNext,
  onSlideSelect,
}: SlideNavigationProps) {
  const hasPrevious = currentSlide > 0;
  const hasNext = currentSlide < totalSlides - 1;

  return (
    <div className="flex items-center justify-between w-full px-4 sm:px-6 lg:px-8 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Previous Button */}
      <Button
        variant="outline"
        size="lg"
        onClick={onPrevious}
        disabled={!hasPrevious}
        className="min-w-[100px]"
      >
        <ChevronLeft className="h-5 w-5 mr-2" />
        Previous
      </Button>

      {/* Slide Dots */}
      <div className="flex items-center gap-2 overflow-x-auto max-w-md px-4">
        {Array.from({ length: totalSlides }, (_, i) => (
          <button
            key={i}
            onClick={() => onSlideSelect(i)}
            className={cn(
              'flex-shrink-0 rounded-full transition-all duration-200',
              'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              i === currentSlide
                ? 'w-3 h-3 bg-blue-600 dark:bg-blue-500'
                : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
            )}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === currentSlide ? 'true' : 'false'}
          />
        ))}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size="lg"
        onClick={onNext}
        disabled={!hasNext}
        className="min-w-[100px]"
      >
        Next
        <ChevronRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
}
