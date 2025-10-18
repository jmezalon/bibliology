import { ChevronDown, ChevronUp, Save } from 'lucide-react';
import { useState, useEffect } from 'react';

import { useAutoSave } from '../../hooks/use-auto-save';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

interface NotesPanelProps {
  slideId: string;
  initialNotes?: string;
  onSave: (notes: string) => Promise<void>;
  language: 'en' | 'fr';
}

/**
 * NotesPanel
 * Collapsible panel for student notes with auto-save
 */
export function NotesPanel({ slideId, initialNotes = '', onSave, language }: NotesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes);

  // Update notes when slide changes
  useEffect(() => {
    setNotes(initialNotes);
  }, [slideId, initialNotes]);

  // Auto-save functionality
  const { saveStatus, triggerSave } = useAutoSave({
    onSave: async () => {
      await onSave(notes);
    },
    delay: 2000,
  });

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleManualSave = () => {
    void triggerSave();
  };

  const notesLabel = language === 'en' ? 'My Notes' : 'Mes Notes';
  const notesPlaceholder =
    language === 'en'
      ? 'Type your notes here... They will be saved automatically.'
      : 'Tapez vos notes ici... Elles seront enregistrées automatiquement.';
  const saveButtonLabel = language === 'en' ? 'Save Now' : 'Enregistrer';

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-all duration-300 shadow-lg',
        isOpen ? 'h-80' : 'h-12',
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{notesLabel}</h3>
          {saveStatus === 'saving' && (
            <span className="text-xs text-blue-600 dark:text-blue-400">Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-600 dark:text-green-400">Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-red-600 dark:text-red-400">Error saving</span>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {/* Notes Content */}
      {isOpen && (
        <div className="px-4 sm:px-6 lg:px-8 pb-4 h-[calc(100%-48px)] flex flex-col">
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder={notesPlaceholder}
            className="flex-1 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {notes.length} characters
            </span>
            <Button size="sm" variant="outline" onClick={handleManualSave}>
              <Save className="h-4 w-4 mr-2" />
              {saveButtonLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
