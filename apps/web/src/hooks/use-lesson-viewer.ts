import { useCallback, useEffect, useRef, useState } from 'react';

interface LessonViewerState {
  currentSlideIndex: number;
  language: 'en' | 'fr';
  viewedSlides: Set<number>;
  timeSpent: number; // in seconds
  isFullScreen: boolean;
  slideNotes: Record<string, string>; // slideId -> notes
}

interface UseLessonViewerOptions {
  totalSlides: number;
  initialSlideIndex?: number;
  initialLanguage?: 'en' | 'fr';
  onSlideChange?: (slideIndex: number) => void;
  onLanguageChange?: (language: 'en' | 'fr') => void;
}

/**
 * useLessonViewer
 * Hook for managing lesson viewer state and interactions
 */
export function useLessonViewer({
  totalSlides,
  initialSlideIndex = 0,
  initialLanguage = 'en',
  onSlideChange,
  onLanguageChange,
}: UseLessonViewerOptions) {

  // State
  const [state, setState] = useState<LessonViewerState>({
    currentSlideIndex: initialSlideIndex,
    language: initialLanguage,
    viewedSlides: new Set([initialSlideIndex]),
    timeSpent: 0,
    isFullScreen: false,
    slideNotes: {},
  });

  // Timer for tracking time spent
  const timerRef = useRef<NodeJS.Timeout>();

  // Start timer on mount
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setState((prev) => ({ ...prev, timeSpent: prev.timeSpent + 1 }));
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Navigation functions
  const goToSlide = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalSlides) return;

      setState((prev) => ({
        ...prev,
        currentSlideIndex: index,
        viewedSlides: new Set([...prev.viewedSlides, index]),
      }));

      onSlideChange?.(index);

      // Update URL
      const params = new URLSearchParams(window.location.search);
      params.set('slide', String(index + 1));
      window.history.replaceState({}, '', `?${params.toString()}`);
    },
    [totalSlides, onSlideChange]
  );

  const goToNextSlide = useCallback(() => {
    if (state.currentSlideIndex < totalSlides - 1) {
      goToSlide(state.currentSlideIndex + 1);
    }
  }, [state.currentSlideIndex, totalSlides, goToSlide]);

  const goToPreviousSlide = useCallback(() => {
    if (state.currentSlideIndex > 0) {
      goToSlide(state.currentSlideIndex - 1);
    }
  }, [state.currentSlideIndex, goToSlide]);

  // Language toggle
  const toggleLanguage = useCallback(() => {
    const newLanguage = state.language === 'en' ? 'fr' : 'en';
    setState((prev) => ({ ...prev, language: newLanguage }));
    onLanguageChange?.(newLanguage);

    // Persist language preference
    localStorage.setItem('preferred_language', newLanguage);
  }, [state.language, onLanguageChange]);

  // Full screen toggle
  const toggleFullScreen = useCallback(() => {
    setState((prev) => ({ ...prev, isFullScreen: !prev.isFullScreen }));
  }, []);

  // Notes management
  const updateSlideNotes = useCallback((slideId: string, notes: string) => {
    setState((prev) => ({
      ...prev,
      slideNotes: { ...prev.slideNotes, [slideId]: notes },
    }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case ' ': // Space bar
          e.preventDefault();
          goToNextSlide();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPreviousSlide();
          break;
        case 'Home':
          e.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          e.preventDefault();
          goToSlide(totalSlides - 1);
          break;
        case 'f':
          e.preventDefault();
          toggleFullScreen();
          break;
        case 'l':
          e.preventDefault();
          toggleLanguage();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextSlide, goToPreviousSlide, goToSlide, toggleFullScreen, toggleLanguage, totalSlides]);

  // Touch gestures (swipe)
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeThreshold = 50; // minimum swipe distance in pixels
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped left -> next slide
        goToNextSlide();
      } else {
        // Swiped right -> previous slide
        goToPreviousSlide();
      }
    }
  }, [goToNextSlide, goToPreviousSlide]);

  // Load language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred_language') as 'en' | 'fr' | null;
    if (savedLanguage && savedLanguage !== state.language) {
      setState((prev) => ({ ...prev, language: savedLanguage }));
      onLanguageChange?.(savedLanguage);
    }
  }, []);

  // Parse initial slide from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slideParam = params.get('slide');
    if (slideParam) {
      const slideIndex = parseInt(slideParam, 10) - 1;
      if (slideIndex >= 0 && slideIndex < totalSlides && slideIndex !== state.currentSlideIndex) {
        goToSlide(slideIndex);
      }
    }
  }, [totalSlides]);

  return {
    // State
    currentSlideIndex: state.currentSlideIndex,
    language: state.language,
    viewedSlides: state.viewedSlides,
    timeSpent: state.timeSpent,
    isFullScreen: state.isFullScreen,
    slideNotes: state.slideNotes,

    // Navigation
    goToSlide,
    goToNextSlide,
    goToPreviousSlide,

    // Controls
    toggleLanguage,
    toggleFullScreen,
    updateSlideNotes,

    // Touch handlers
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
