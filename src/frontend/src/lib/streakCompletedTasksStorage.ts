// Storage helpers for current streak completed tasks list

const STREAK_TASKS_KEY = 'streak-completed-tasks';

export interface StreakCompletedTask {
  title: string;
  completedAt: number; // timestamp
}

/**
 * Safely load the current streak's completed tasks list from localStorage
 * Returns empty array if missing or corrupt
 */
export function loadStreakCompletedTasks(): StreakCompletedTask[] {
  try {
    const raw = localStorage.getItem(STREAK_TASKS_KEY);
    if (!raw) return [];
    
    const parsed = JSON.parse(raw);
    
    // Validate structure
    if (!Array.isArray(parsed)) return [];
    
    // Validate each item has required fields
    const valid = parsed.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.title === 'string' &&
        typeof item.completedAt === 'number'
    );
    
    return valid ? parsed : [];
  } catch (error) {
    console.error('Error loading streak completed tasks:', error);
    return [];
  }
}

/**
 * Safely save the current streak's completed tasks list to localStorage
 */
export function saveStreakCompletedTasks(tasks: StreakCompletedTask[]): void {
  try {
    localStorage.setItem(STREAK_TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving streak completed tasks:', error);
  }
}

/**
 * Clear the current streak's completed tasks list
 */
export function clearStreakCompletedTasks(): void {
  try {
    localStorage.setItem(STREAK_TASKS_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('Error clearing streak completed tasks:', error);
  }
}
