// Local deterministic brain dump task extractor
// No external AI/LLM calls - works offline

/**
 * Extracts individual task strings from freeform brain dump text.
 * Handles:
 * - Newline-separated items
 * - Bullet points (•, -, *, +)
 * - Numbered lists (1., 2), etc.)
 * - Semicolon-separated tasks on a single line
 * - Multi-task sentences with conjunctions (and then, then, after that, next)
 * - Comma-separated task sequences
 * 
 * Returns an array of cleaned task strings ready for classification.
 */
export function extractTasksFromBrainDump(text: string): string[] {
  if (!text || !text.trim()) {
    return [];
  }

  const tasks: string[] = [];

  // Step 1: Split by newlines
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  for (const line of lines) {
    // Step 2: Remove common bullet prefixes (•, -, *, +) with or without space
    let cleaned = line.replace(/^[•\-*+]\s*/, '').trim();

    // Step 3: Remove numbered list prefixes (1., 2), 3:, 4-, etc.) with or without space
    cleaned = cleaned.replace(/^\d+[\.\):\-]\s*/, '').trim();

    if (!cleaned) continue;

    // Step 4: Split by semicolons (strong separator)
    const semicolonSegments = cleaned.split(';').map(seg => seg.trim()).filter(seg => seg.length > 0);

    for (const segment of semicolonSegments) {
      // Step 5: Attempt to split multi-task sentences by conjunctions
      const splitTasks = splitMultiTaskSentence(segment);
      tasks.push(...splitTasks);
    }
  }

  // Post-processing: If we detected multiple separators in the input but only got 1 task,
  // try to split more aggressively
  if (tasks.length === 1 && hasMultipleSeparators(text)) {
    const aggressiveTasks = aggressiveSplit(text);
    if (aggressiveTasks.length > 1) {
      return aggressiveTasks;
    }
  }

  return tasks;
}

/**
 * Checks if the input text contains multiple task separators
 */
function hasMultipleSeparators(text: string): boolean {
  const separatorCount = 
    (text.match(/\n/g) || []).length +
    (text.match(/[•\-*+]\s/g) || []).length +
    (text.match(/\d+[\.\):\-]\s/g) || []).length +
    (text.match(/;/g) || []).length +
    (text.match(/\s+and then\s+/gi) || []).length +
    (text.match(/\s+then\s+/gi) || []).length +
    (text.match(/\s+after that\s+/gi) || []).length +
    (text.match(/\s+next\s+/gi) || []).length;
  
  return separatorCount >= 2;
}

/**
 * More aggressive splitting when we detect the user intended multiple tasks
 */
function aggressiveSplit(text: string): string[] {
  const tasks: string[] = [];
  
  // Split by any combination of separators
  const segments = text
    .split(/[\n;]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const segment of segments) {
    // Remove bullet/number prefixes
    let cleaned = segment.replace(/^[•\-*+]\s*/, '').trim();
    cleaned = cleaned.replace(/^\d+[\.\):\-]\s*/, '').trim();
    
    if (!cleaned) continue;
    
    // Try splitting by conjunctions
    const split = splitMultiTaskSentence(cleaned);
    tasks.push(...split);
  }
  
  return tasks.filter(t => t.length > 0);
}

/**
 * Splits a sentence that contains multiple tasks joined by conjunctions.
 * Uses conservative heuristics to avoid over-splitting.
 */
function splitMultiTaskSentence(text: string): string[] {
  // Patterns that indicate task boundaries (ordered by specificity)
  const separatorPatterns = [
    { pattern: /,\s*and then\s+/gi, name: 'comma-and-then' },
    { pattern: /,\s*then\s+/gi, name: 'comma-then' },
    { pattern: /\s+and then\s+/gi, name: 'and-then' },
    { pattern: /\s+after that\s+/gi, name: 'after-that' },
    { pattern: /\s+then\s+/gi, name: 'then' },
    { pattern: /\s+next\s+/gi, name: 'next' },
  ];

  let segments: string[] = [text];

  // Try each separator pattern
  for (const { pattern } of separatorPatterns) {
    const newSegments: string[] = [];
    
    for (const segment of segments) {
      const parts = segment.split(pattern);
      
      // Only split if all resulting parts look like valid tasks
      if (parts.length > 1 && parts.every(part => isValidTaskSegment(part.trim()))) {
        newSegments.push(...parts.map(p => p.trim()).filter(p => p.length > 0));
      } else {
        newSegments.push(segment);
      }
    }
    
    segments = newSegments;
  }

  // Try splitting by " and " only if both sides are clearly standalone tasks
  if (segments.length === 1 && segments[0].includes(' and ')) {
    const andParts = segments[0].split(/\s+and\s+/i);
    if (andParts.length === 2 && 
        andParts.every(part => isStrongTaskSegment(part.trim()))) {
      segments = andParts.map(p => p.trim()).filter(p => p.length > 0);
    }
  }

  return segments.filter(seg => seg.length > 0);
}

/**
 * Checks if a text segment looks like a valid standalone task.
 * Avoids creating fragments that are too short or don't resemble actions.
 */
function isValidTaskSegment(text: string): boolean {
  // Must have minimum length (at least a few words)
  if (text.length < 8) {
    return false;
  }

  // Must have at least 2 words
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 2) {
    return false;
  }

  // Should not be just a trailing fragment (e.g., "it", "that", "this")
  const firstWord = words[0].toLowerCase();
  const fragmentWords = ['it', 'that', 'this', 'them', 'those', 'these'];
  if (words.length === 2 && fragmentWords.includes(firstWord)) {
    return false;
  }

  // Should ideally start with a verb or action word (but not required)
  // This is a soft check - we're being conservative
  const actionWords = [
    'add', 'build', 'call', 'check', 'clean', 'complete', 'create', 'debug',
    'delete', 'design', 'develop', 'document', 'draft', 'email', 'file',
    'finish', 'fix', 'follow', 'implement', 'make', 'meet', 'organize',
    'plan', 'prepare', 'read', 'refactor', 'reply', 'research', 'review',
    'schedule', 'send', 'setup', 'test', 'update', 'write', 'contact',
    'analyze', 'configure', 'deploy', 'integrate', 'migrate', 'optimize',
    'prototype', 'coordinate', 'monitor', 'track', 'respond', 'browse',
    'watch', 'listen', 'sort', 'archive', 'backup', 'copy', 'format',
    'rename', 'move', 'download', 'upload', 'brainstorm', 'innovate',
    'conceptualize', 'learn', 'study', 'practice', 'exercise', 'meditate',
    'buy', 'get', 'pick', 'drop', 'take', 'bring', 'fetch', 'collect',
    'submit', 'approve', 'reject', 'validate', 'verify', 'confirm'
  ];

  // If it starts with an action word, it's likely a valid task
  if (actionWords.includes(firstWord)) {
    return true;
  }

  // If it doesn't start with an action word but has reasonable length, still accept it
  // (user might write "Meeting with John" instead of "Schedule meeting with John")
  return words.length >= 3;
}

/**
 * Stricter check for "and" splitting - both sides must be strong standalone tasks
 */
function isStrongTaskSegment(text: string): boolean {
  if (!isValidTaskSegment(text)) {
    return false;
  }

  const words = text.split(/\s+/).filter(w => w.length > 0);
  const firstWord = words[0].toLowerCase();
  
  // Must start with an action word or be a clear noun phrase (3+ words)
  const actionWords = [
    'add', 'build', 'call', 'check', 'clean', 'complete', 'create', 'debug',
    'delete', 'design', 'develop', 'document', 'draft', 'email', 'file',
    'finish', 'fix', 'follow', 'implement', 'make', 'meet', 'organize',
    'plan', 'prepare', 'read', 'refactor', 'reply', 'research', 'review',
    'schedule', 'send', 'setup', 'test', 'update', 'write', 'contact',
    'analyze', 'configure', 'deploy', 'integrate', 'migrate', 'optimize',
    'prototype', 'coordinate', 'monitor', 'track', 'respond', 'browse',
    'watch', 'listen', 'sort', 'archive', 'backup', 'copy', 'format',
    'rename', 'move', 'download', 'upload', 'brainstorm', 'innovate',
    'conceptualize', 'learn', 'study', 'practice', 'exercise', 'meditate',
    'buy', 'get', 'pick', 'drop', 'take', 'bring', 'fetch', 'collect',
    'submit', 'approve', 'reject', 'validate', 'verify', 'confirm'
  ];

  return actionWords.includes(firstWord) || words.length >= 3;
}
