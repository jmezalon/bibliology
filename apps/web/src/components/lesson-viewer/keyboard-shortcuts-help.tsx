import { Keyboard } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

interface KeyboardShortcut {
  key: string;
  description_en: string;
  description_fr: string;
}

const SHORTCUTS: KeyboardShortcut[] = [
  {
    key: '→ / Space',
    description_en: 'Next slide',
    description_fr: 'Diapositive suivante',
  },
  {
    key: '←',
    description_en: 'Previous slide',
    description_fr: 'Diapositive précédente',
  },
  {
    key: 'Home',
    description_en: 'First slide',
    description_fr: 'Première diapositive',
  },
  {
    key: 'End',
    description_en: 'Last slide',
    description_fr: 'Dernière diapositive',
  },
  {
    key: 'L',
    description_en: 'Toggle language (EN/FR)',
    description_fr: 'Changer de langue (EN/FR)',
  },
  {
    key: 'F',
    description_en: 'Toggle fullscreen',
    description_fr: 'Basculer en plein écran',
  },
  {
    key: '?',
    description_en: 'Show this help',
    description_fr: 'Afficher cette aide',
  },
];

interface KeyboardShortcutsHelpProps {
  language: 'en' | 'fr';
}

/**
 * KeyboardShortcutsHelp
 * Modal showing available keyboard shortcuts
 */
export function KeyboardShortcutsHelp({ language }: KeyboardShortcutsHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for '?' key to open help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const title = language === 'en' ? 'Keyboard Shortcuts' : 'Raccourcis clavier';
  const description =
    language === 'en'
      ? 'Use these keyboard shortcuts to navigate the lesson efficiently'
      : 'Utilisez ces raccourcis clavier pour naviguer efficacement dans la leçon';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="fixed bottom-20 right-4 sm:bottom-4 z-30 shadow-lg"
          title={title}
        >
          <Keyboard className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {SHORTCUTS.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <kbd className="px-3 py-1.5 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm">
                {shortcut.key}
              </kbd>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'en' ? shortcut.description_en : shortcut.description_fr}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {language === 'en'
              ? 'Press ? anytime to show this help'
              : 'Appuyez sur ? à tout moment pour afficher cette aide'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
