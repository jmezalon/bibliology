import { useEffect, useRef, useState, useCallback } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseAutoSaveOptions {
  onSave: () => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export interface UseAutoSaveReturn {
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  triggerSave: () => Promise<void>;
  hasUnsavedChanges: boolean;
  resetSaveState: () => void;
}

/**
 * Hook for auto-saving with debounce
 *
 * @param onSave - Async function to call when saving
 * @param delay - Debounce delay in milliseconds (default: 2000)
 * @param enabled - Whether auto-save is enabled (default: true)
 *
 * @returns Object with save status, last saved time, and trigger function
 *
 * @example
 * const { saveStatus, lastSaved, triggerSave, hasUnsavedChanges } = useAutoSave({
 *   onSave: async () => {
 *     await updateSlide(slideData);
 *   },
 *   delay: 2000,
 * });
 */
export function useAutoSave({
  onSave,
  delay: _delay = 2000,
  enabled: _enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const saveQueuedRef = useRef(false);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Execute the save operation
  const executeSave = useCallback(async () => {
    if (isSavingRef.current) {
      // If already saving, queue another save
      saveQueuedRef.current = true;
      return;
    }

    isSavingRef.current = true;
    setSaveStatus('saving');

    try {
      await onSave();
      setSaveStatus('saved');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      // If another save was queued while we were saving, execute it
      if (saveQueuedRef.current) {
        saveQueuedRef.current = false;
        setTimeout(() => {
          void executeSave();
        }, 100);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave]);

  // Immediate save (no debounce)
  const triggerSave = useCallback(async () => {
    // Clear any pending debounced save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    await executeSave();
  }, [executeSave]);

  // Reset save state
  const resetSaveState = useCallback(() => {
    setSaveStatus('idle');
    setHasUnsavedChanges(false);
  }, []);

  return {
    saveStatus,
    lastSaved,
    triggerSave,
    hasUnsavedChanges,
    resetSaveState,
  };
}

/**
 * Hook to trigger auto-save on value changes
 *
 * @example
 * const autoSave = useAutoSave({ onSave: saveData });
 *
 * // Trigger auto-save when content changes
 * useAutoSaveOnChange(autoSave, [content, metadata]);
 */
export function useAutoSaveOnChange(
  autoSave: Pick<UseAutoSaveReturn, 'triggerSave'>,
  dependencies: unknown[],
) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip first render to avoid saving on mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    void autoSave.triggerSave();
  }, dependencies);
}
