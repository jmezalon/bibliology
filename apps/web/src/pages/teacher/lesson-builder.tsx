import { ArrowLeft, Save, Eye, Monitor } from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { PropertiesPanel } from '../../components/lesson-builder/properties-panel';
import { SlideCanvas } from '../../components/lesson-builder/slide-canvas';
import { SlideThumbnailStrip } from '../../components/lesson-builder/slide-thumbnail-strip';
import { SlideToolbar } from '../../components/lesson-builder/slide-toolbar';
import { Button } from '../../components/ui/button';
import {
  useLesson,
  useUpdateLesson,
  useCreateSlide,
  useUpdateSlide,
  useDeleteSlide,
  useDuplicateSlide,
  useReorderSlides,
} from '../../hooks/use-lesson';
import {
  useCreateContentBlock,
  useUpdateContentBlock,
  useDeleteContentBlock,
  useDuplicateContentBlock,
  useReorderContentBlocks,
} from '../../hooks/use-slides';
import { toast } from '../../hooks/use-toast';
import { debounce } from '../../lib/utils';
import type { UpdateLessonRequest } from '../../types/course';
import type {
  SlideLayoutType,
  Slide,
  LessonWithSlides,
  ContentBlockType,
} from '../../types/lesson-builder';

export function LessonBuilderPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();

  const [currentSlideId, setCurrentSlideId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Fetch lesson data
  const { data: lesson, isLoading, isError } = useLesson(lessonId);

  // Slide mutations
  const updateLessonMutation = useUpdateLesson(lessonId || '');
  const createSlideMutation = useCreateSlide(lessonId || '');
  const updateSlideMutation = useUpdateSlide(lessonId || '', currentSlideId || '');
  const deleteSlideMutation = useDeleteSlide(lessonId || '');
  const duplicateSlideMutation = useDuplicateSlide(lessonId || '');
  const reorderSlidesMutation = useReorderSlides(lessonId || '');

  // Content block mutations
  const createContentBlockMutation = useCreateContentBlock(currentSlideId || '', lessonId || '');
  const updateContentBlockMutation = useUpdateContentBlock(currentSlideId || '', lessonId || '');
  const deleteContentBlockMutation = useDeleteContentBlock(currentSlideId || '', lessonId || '');
  const duplicateContentBlockMutation = useDuplicateContentBlock(
    currentSlideId || '',
    lessonId || '',
  );
  const reorderContentBlocksMutation = useReorderContentBlocks(
    currentSlideId || '',
    lessonId || '',
  );

  // Set current slide when lesson loads
  useEffect(() => {
    if (lesson && lesson.slides.length > 0 && !currentSlideId) {
      setCurrentSlideId(lesson.slides[0].id);
    }
  }, [lesson, currentSlideId]);

  // Check minimum screen width
  const [isScreenTooSmall, setIsScreenTooSmall] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsScreenTooSmall(window.innerWidth < 1280);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + S: Save
      if (modKey && e.key === 's') {
        e.preventDefault();
        void handleSave();
      }

      // Cmd/Ctrl + P: Preview
      if (modKey && e.key === 'p') {
        e.preventDefault();
        setIsPreviewMode((prev) => !prev);
      }

      // Cmd/Ctrl + D: Duplicate slide
      if (modKey && e.key === 'd' && currentSlideId) {
        e.preventDefault();
        void handleDuplicateSlide(currentSlideId);
      }

      // Arrow keys: Navigate slides
      if (!lesson) return;

      const currentIndex = lesson.slides.findIndex((s) => s.id === currentSlideId);

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        setCurrentSlideId(lesson.slides[currentIndex - 1].id);
      }

      if (e.key === 'ArrowRight' && currentIndex < lesson.slides.length - 1) {
        e.preventDefault();
        setCurrentSlideId(lesson.slides[currentIndex + 1].id);
      }

      // Delete/Backspace: Delete slide (with confirmation)
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        currentSlideId &&
        e.target === document.body
      ) {
        e.preventDefault();
        void handleDeleteSlide(currentSlideId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lesson, currentSlideId]);

  // Save handler
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In real implementation, this would batch all pending changes
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate save
      setLastSavedAt(new Date());
      toast({
        title: 'Saved',
        description: 'Lesson saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save lesson',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced auto-save
  const debouncedAutoSave = useCallback(
    debounce(() => {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setLastSavedAt(new Date());
      }, 500);
    }, 2000),
    [],
  );

  // Slide operations
  const handleAddSlide = async (layout: SlideLayoutType) => {
    if (!lessonId) return;

    await createSlideMutation.mutateAsync({
      lesson_id: lessonId,
      layout,
      slide_order: lesson?.slides.length || 0,
    });
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (!lesson || lesson.slides.length <= 1) {
      toast({
        title: 'Cannot Delete',
        description: 'Lesson must have at least one slide',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this slide? This action cannot be undone.',
    );

    if (confirmed) {
      // Set next slide as current before deleting
      const currentIndex = lesson.slides.findIndex((s) => s.id === slideId);
      const nextSlide = lesson.slides[currentIndex + 1] || lesson.slides[currentIndex - 1];

      if (nextSlide) {
        setCurrentSlideId(nextSlide.id);
      }

      await deleteSlideMutation.mutateAsync(slideId);
    }
  };

  const handleDuplicateSlide = async (slideId: string) => {
    await duplicateSlideMutation.mutateAsync(slideId);
  };

  const handleSlideReorder = async (reorderedSlides: Slide[]) => {
    const slideOrders = reorderedSlides.map((slide, index) => ({
      slide_id: slide.id,
      order: index,
    }));

    await reorderSlidesMutation.mutateAsync({ slide_orders: slideOrders });
  };

  // Lesson updates
  const handleLessonUpdate = (data: Partial<LessonWithSlides>) => {
    // Convert null to undefined for API compatibility
    const cleanedData: UpdateLessonRequest = {
      ...data,
      title_fr: data.title_fr === null ? undefined : data.title_fr,
      description_fr: data.description_fr === null ? undefined : data.description_fr,
    };
    updateLessonMutation.mutate(cleanedData);
    debouncedAutoSave();
  };

  // Slide updates
  const handleSlideUpdate = (data: Partial<Slide>) => {
    if (!currentSlideId) return;
    updateSlideMutation.mutate(data);
    debouncedAutoSave();
  };

  // Content block operations
  const handleContentBlockUpdate = useCallback(
    (blockId: string, content: string, metadata?: Record<string, unknown>) => {
      if (!currentSlideId) return;
      void updateContentBlockMutation.mutateAsync({
        blockId,
        data: { content, metadata },
      });
      debouncedAutoSave();
    },
    [currentSlideId, updateContentBlockMutation, debouncedAutoSave],
  );

  const handleContentBlockDelete = useCallback(
    async (blockId: string) => {
      if (!currentSlideId) return;
      await deleteContentBlockMutation.mutateAsync(blockId);
    },
    [currentSlideId, deleteContentBlockMutation],
  );

  const handleContentBlockAdd = useCallback(
    async (type: ContentBlockType) => {
      if (!currentSlideId) return;

      // Get the current number of blocks to set the order
      const currentSlide = lesson?.slides.find((s) => s.id === currentSlideId);
      const blockOrder = currentSlide?.content_blocks.length || 0;

      // Provide default content based on block type
      /* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
      const getDefaultContent = (blockType: ContentBlockType): string => {
        switch (blockType) {
          case 'HEADING':
            return JSON.stringify({ text: 'New Heading', level: 2, alignment: 'left' });
          case 'TEXT':
            return JSON.stringify({ html: '<p>Enter your text here</p>' });
          case 'IMAGE':
            return JSON.stringify({ imageUrl: '', imageAlt: '', caption: '' });
          case 'VERSE':
            return JSON.stringify({ html: '<p></p>', verseReference: '', translation: 'NIV' });
          case 'VOCABULARY':
            return JSON.stringify({ html: '<p></p>', term_en: '', term_fr: '' });
          case 'LIST':
            return JSON.stringify({ listStyle: 'bullet', items: ['Item 1'] });
          case 'CALLOUT':
            return JSON.stringify({
              html: '<p>Important note</p>',
              calloutType: 'info',
              title: '',
            });
          case 'DIVIDER':
            return JSON.stringify({ style: 'solid', width: 'full' });
          default:
            return JSON.stringify({});
        }
      };
      /* eslint-enable @typescript-eslint/no-unsafe-enum-comparison */

      await createContentBlockMutation.mutateAsync({
        slide_id: currentSlideId,
        type,
        content: getDefaultContent(type),
        order: blockOrder,
      });
    },
    [currentSlideId, lesson?.slides, createContentBlockMutation],
  );

  const handleContentBlockDuplicate = useCallback(
    async (blockId: string) => {
      if (!currentSlideId) return;
      await duplicateContentBlockMutation.mutateAsync(blockId);
    },
    [currentSlideId, duplicateContentBlockMutation],
  );

  const handleContentBlockReorder = useCallback(
    async (blockOrders: { block_id: string; order: number }[]) => {
      if (!currentSlideId) return;
      await reorderContentBlocksMutation.mutateAsync({ block_orders: blockOrders });
    },
    [currentSlideId, reorderContentBlocksMutation],
  );

  // Get current slide - memoized to prevent recalculations
  const currentSlide = useMemo(
    () => lesson?.slides.find((s) => s.id === currentSlideId) || null,
    [lesson?.slides, currentSlideId],
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading lesson...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !lesson) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Lesson Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The lesson you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate(`/teacher/courses/${courseId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  // Screen too small warning
  if (isScreenTooSmall) {
    return (
      <div className="flex h-screen items-center justify-center p-8">
        <div className="text-center max-w-md">
          <Monitor className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Screen Too Small
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            The Lesson Builder requires a minimum screen width of 1280px. Please use a larger screen
            or increase your browser window size.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-100 dark:bg-gray-950">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/teacher/courses/${courseId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="border-l border-gray-300 dark:border-gray-700 h-6" />

          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {lesson.title_en}
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {isSaving
                ? 'Saving...'
                : lastSavedAt
                  ? `Last saved at ${lastSavedAt.toLocaleTimeString()}`
                  : 'All changes saved'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsPreviewMode(!isPreviewMode)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>

          <Button variant="default" size="sm" onClick={() => void handleSave()} loading={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>

          <div className="border-l border-gray-300 dark:border-gray-700 h-6 mx-2" />

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Published</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={lesson.is_published}
                onChange={(e) => handleLessonUpdate({ is_published: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Slide Thumbnails */}
        <div className="w-[220px] flex-shrink-0">
          <SlideThumbnailStrip
            slides={lesson.slides}
            currentSlideId={currentSlideId}
            onSlideClick={setCurrentSlideId}
            onSlideDelete={(slideId) => void handleDeleteSlide(slideId)}
            onSlideDuplicate={(slideId) => void handleDuplicateSlide(slideId)}
            onSlideReorder={(slides) => void handleSlideReorder(slides)}
            onAddSlide={(layout) => void handleAddSlide(layout)}
          />
        </div>

        {/* Center - Canvas Area */}
        <div className="flex-1 flex flex-col">
          <SlideToolbar
            slide={currentSlide}
            onLayoutChange={(layout) => handleSlideUpdate({ layout })}
          />
          <SlideCanvas
            slide={currentSlide}
            onContentBlockUpdate={handleContentBlockUpdate}
            onContentBlockDelete={(blockId) => void handleContentBlockDelete(blockId)}
            onContentBlockAdd={(type) => void handleContentBlockAdd(type)}
            onContentBlockDuplicate={(blockId) => void handleContentBlockDuplicate(blockId)}
            onContentBlockReorder={(blockOrders) => void handleContentBlockReorder(blockOrders)}
            previewMode={isPreviewMode}
          />
        </div>

        {/* Right Sidebar - Properties Panel */}
        <div className="w-[320px] flex-shrink-0">
          <PropertiesPanel
            lesson={lesson}
            currentSlide={currentSlide}
            onLessonUpdate={handleLessonUpdate}
            onSlideUpdate={handleSlideUpdate}
          />
        </div>
      </div>

      {/* Keyboard Shortcuts Help (optional - can be toggled) */}
      <div className="hidden fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-4 py-2 rounded-full">
        <span className="font-semibold">Shortcuts:</span> Cmd+S Save • Cmd+P Preview • Cmd+D
        Duplicate • ← → Navigate
      </div>
    </div>
  );
}
