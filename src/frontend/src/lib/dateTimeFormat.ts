// Date and time formatting utilities for task timestamps

/**
 * Format a timestamp as a date string (e.g., "Feb 14, 2026")
 */
export function formatDate(timestamp: number | null | undefined): string {
  if (!timestamp) return '—';
  
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a timestamp as a time string (e.g., "2:30 PM")
 */
export function formatTime(timestamp: number | null | undefined): string {
  if (!timestamp) return '—';
  
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a planned timeline string or return placeholder
 */
export function formatPlannedTimeline(timeline: string | undefined): string {
  if (!timeline || timeline.trim() === '') return '—';
  return timeline;
}

/**
 * Format a completion timestamp or return placeholder for incomplete tasks
 */
export function formatCompletedTime(timestamp: number | null | undefined): string {
  if (!timestamp) return '—';
  return formatTime(timestamp);
}
