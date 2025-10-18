import { ArrowLeft, Globe, Maximize, Minimize } from 'lucide-react';

import { Button } from '../ui/button';

interface LessonViewerHeaderProps {
  lessonTitle: string;
  courseTitle?: string;
  language: 'en' | 'fr';
  onLanguageToggle: () => void;
  onBack?: () => void;
  isFullScreen?: boolean;
  onFullScreenToggle?: () => void;
}

/**
 * LessonViewerHeader
 * Header for lesson viewer with title, controls, and language toggle
 */
export function LessonViewerHeader({
  lessonTitle,
  courseTitle,
  language,
  onLanguageToggle,
  onBack,
  isFullScreen = false,
  onFullScreenToggle,
}: LessonViewerHeaderProps) {
  return (
    <header className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Back button and title */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="flex-shrink-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
              {lessonTitle}
            </h1>
            {courseTitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{courseTitle}</p>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Language Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={onLanguageToggle}
            className="min-w-[80px]"
          >
            <Globe className="h-4 w-4 mr-2" />
            {language === 'en' ? 'EN' : 'FR'}
          </Button>

          {/* Full Screen Toggle (mobile/tablet) */}
          {onFullScreenToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onFullScreenToggle}
              className="hidden sm:flex"
            >
              {isFullScreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
