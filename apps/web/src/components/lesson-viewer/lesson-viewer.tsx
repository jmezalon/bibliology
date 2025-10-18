import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useLesson } from '../../hooks/use-lesson';
import { useLessonViewer } from '../../hooks/use-lesson-viewer';
import apiClient from '../../lib/api/client';
import { cn } from '../../lib/utils';

import { KeyboardShortcutsHelp } from './keyboard-shortcuts-help';
import { LessonViewerHeader } from './lesson-viewer-header';
import { NotesPanel } from './notes-panel';
import { ProgressBar } from './progress-bar';
import { SlideContentRenderer } from './slide-content-renderer';
import { SlideNavigation } from './slide-navigation';


/**
 * LessonViewer
 * Main component for viewing lessons as a student
 */
export function LessonViewer() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  // Fetch lesson data
  const { data: lesson, isLoading, error } = useLesson(lessonId || '');

  // Calculate total slides
  const totalSlides = lesson?.slides?.length || 0;

  // Lesson viewer state and controls
  const {
    currentSlideIndex,
    language,
    viewedSlides,
    timeSpent,
    isFullScreen,
    slideNotes,
    goToSlide,
    goToNextSlide,
    goToPreviousSlide,
    toggleLanguage,
    toggleFullScreen,
    updateSlideNotes,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useLessonViewer({
    totalSlides,
    initialSlideIndex: 0,
    initialLanguage: 'en',
  });

  // Get current slide
  const currentSlide = lesson?.slides?.[currentSlideIndex];

  // Handle notes save
  const handleNotesSave = async (notes: string) => {
    if (!currentSlide) return;

    updateSlideNotes(currentSlide.id, notes);

    // Save to backend (you'll need to implement this endpoint)
    try {
      await apiClient.post(`/slides/${currentSlide.id}/student-notes`, {
        notes,
        language,
      });
    } catch (error) {
      console.error('Failed to save notes:', error);
      throw error;
    }
  };

  // Track slide view (analytics)
  useEffect(() => {
    if (!currentSlide) return;

    // Track slide view for analytics
    const trackSlideView = async () => {
      try {
        await apiClient.post(`/slides/${currentSlide.id}/view`, {
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to track slide view:', error);
      }
    };

    void trackSlideView();
  }, [currentSlide?.id]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading lesson...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !lesson) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Lesson Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error?.message || 'The lesson you are looking for could not be found.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No slides
  if (totalSlides === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            No Slides Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This lesson doesn't have any slides yet.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Get lesson title based on language
  const lessonTitle = language === 'en' ? lesson.title_en : lesson.title_fr || lesson.title_en;

  return (
    <div
      className={cn(
        'flex flex-col h-screen bg-gray-50 dark:bg-gray-900',
        isFullScreen && 'fixed inset-0 z-50'
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <LessonViewerHeader
        lessonTitle={lessonTitle}
        language={language}
        onLanguageToggle={toggleLanguage}
        onBack={() => navigate(-1)}
        isFullScreen={isFullScreen}
        onFullScreenToggle={toggleFullScreen}
      />

      {/* Progress Bar */}
      <ProgressBar
        currentSlide={currentSlideIndex}
        totalSlides={totalSlides}
        viewedSlides={viewedSlides}
        timeSpent={timeSpent}
        estimatedDuration={lesson.duration_minutes}
      />

      {/* Slide Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="py-8">
          {/* Slide Title */}
          {currentSlide && (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {language === 'en'
                  ? currentSlide.title_en
                  : currentSlide.title_fr || currentSlide.title_en}
              </h2>
            </div>
          )}

          {/* Content Blocks */}
          {currentSlide && (
            <SlideContentRenderer blocks={currentSlide.content_blocks} language={language} />
          )}
        </div>
      </main>

      {/* Navigation */}
      <SlideNavigation
        currentSlide={currentSlideIndex}
        totalSlides={totalSlides}
        onPrevious={goToPreviousSlide}
        onNext={goToNextSlide}
        onSlideSelect={goToSlide}
      />

      {/* Notes Panel */}
      {currentSlide && (
        <NotesPanel
          slideId={currentSlide.id}
          initialNotes={slideNotes[currentSlide.id] || ''}
          onSave={handleNotesSave}
          language={language}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp language={language} />
    </div>
  );
}
