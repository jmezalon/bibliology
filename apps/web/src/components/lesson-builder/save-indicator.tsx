import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

import type { SaveStatus } from '../../hooks/use-auto-save';
import { cn } from '../../lib/utils';

interface SaveIndicatorProps {
  status: SaveStatus;
  lastSaved: Date | null;
  className?: string;
  showText?: boolean;
}

export function SaveIndicator({
  status,
  lastSaved,
  className,
  showText = true,
}: SaveIndicatorProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: 'Saving...',
          color: 'text-blue-600 dark:text-blue-400',
        };
      case 'saved':
        return {
          icon: <Check className="h-4 w-4" />,
          text: lastSaved
            ? `Saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}`
            : 'Saved',
          color: 'text-green-600 dark:text-green-400',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Error saving',
          color: 'text-red-600 dark:text-red-400',
        };
      case 'idle':
      default:
        return null;
    }
  };

  const display = getStatusDisplay();

  if (!display) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', display.color, className)}>
      {display.icon}
      {showText && <span className="text-sm font-medium">{display.text}</span>}
    </div>
  );
}

interface UnsavedChangesIndicatorProps {
  hasUnsavedChanges: boolean;
  className?: string;
}

export function UnsavedChangesIndicator({
  hasUnsavedChanges,
  className,
}: UnsavedChangesIndicatorProps) {
  if (!hasUnsavedChanges) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2 text-amber-600 dark:text-amber-400', className)}>
      <div className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse" />
      <span className="text-sm font-medium">Unsaved changes</span>
    </div>
  );
}

interface CompactSaveIndicatorProps {
  status: SaveStatus;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  className?: string;
}

/**
 * Compact version that shows a single dot/icon based on state
 */
export function CompactSaveIndicator({
  status,
  hasUnsavedChanges,
  lastSaved,
  className,
}: CompactSaveIndicatorProps) {
  if (status === 'saving') {
    return (
      <div className={cn('flex items-center', className)} title="Saving...">
        <Loader2 className="h-3 w-3 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={cn('flex items-center', className)} title="Error saving">
        <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
      </div>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <div className={cn('flex items-center', className)} title="Unsaved changes">
        <div className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse" />
      </div>
    );
  }

  if (status === 'saved' && lastSaved) {
    return (
      <div
        className={cn('flex items-center', className)}
        title={`Saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}`}
      >
        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
      </div>
    );
  }

  return null;
}
