// Date utility functions

/**
 * Format a date to ISO string
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}
