// Shared client-side types and normalization helpers for tasks and brain dump items

export interface BacklogTask {
  id: string;
  title: string;
  why: string;
  energy: string;
  steps: string[];
  estimatedMinutes: number;
  completedSteps: number[];
  note: string;
  lastFriction: { reason: string; timestamp: number } | null;
  createdAt: number;
  plannedTimeline?: string;
  completedAt?: number | null;
}

export interface BrainDumpItem {
  id: string;
  text: string;
  suggestedCategory: string;
  selectedCategory: string;
  categoryOverridden: boolean;
  createdAt: number;
  plannedTimeline?: string;
}

/**
 * Normalize a backlog task loaded from storage to ensure all timestamp fields exist
 */
export function normalizeBacklogTask(task: any): BacklogTask {
  return {
    ...task,
    createdAt: task.createdAt || Date.now(),
    plannedTimeline: task.plannedTimeline || '',
    completedAt: task.completedAt || null,
  };
}

/**
 * Normalize a brain dump item loaded from storage to ensure all timestamp fields exist
 */
export function normalizeBrainDumpItem(item: any): BrainDumpItem {
  return {
    ...item,
    createdAt: item.createdAt || Date.now(),
    plannedTimeline: item.plannedTimeline || '',
  };
}
