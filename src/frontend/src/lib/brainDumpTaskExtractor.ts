// Local deterministic brain dump task extractor with AI-like smart parsing
// No external AI/LLM calls - works offline

/**
 * Extracts individual task strings from freeform brain dump text.
 * Handles:
 * - Newline-separated items
 * - Bullet points (•, -, *, +)
 * - Numbered lists (1., 2), etc.)
 * - Semicolon-separated tasks on a single line
 * - Speech-to-text run-ons with connectors (and then, then, after that, next, also)
 * - Multi-task sentences with conjunctions
 * - Comma-separated task sequences
 * - "and" conjunctions between distinct tasks
 * - Abstract thought phrasing ("I need to...", "I should...", etc.)
 * 
 * Returns an array of cleaned task strings ready for classification.
 */
export function extractTasksFromBrainDump(text: string): string[] {
  if (!text || !text.trim()) {
    return [];
  }

  const tasks: string[] = [];

  // Step 1: Split by newlines first to preserve line boundaries
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

  for (const line of lines) {
    // Step 2: Normalize each line individually for speech patterns (preserves line separation)
    const normalized = normalizeLineForSpeech(line);

    // Step 3: Remove common bullet prefixes (•, -, *, +) with or without space
    let cleaned = normalized.replace(/^[•\-*+]\s*/, '').trim();

    // Step 4: Remove numbered list prefixes (1., 2), 3:, 4-, etc.) with or without space
    cleaned = cleaned.replace(/^\d+[\.\):\-]\s*/, '').trim();

    if (!cleaned) continue;

    // Step 5: Split by semicolons (strong separator)
    const semicolonSegments = cleaned.split(';').map(seg => seg.trim()).filter(seg => seg.length > 0);

    for (const segment of semicolonSegments) {
      // Step 6: Attempt to split multi-task sentences by speech connectors and conjunctions
      const splitTasks = splitMultiTaskSentence(segment);
      tasks.push(...splitTasks);
    }
  }

  // Post-processing: Validate and clean up
  const validTasks = tasks
    .map(task => cleanTaskText(task))
    .filter(task => task.length > 0 && isValidTaskSegment(task));

  // Deduplication: remove near-duplicates
  const deduplicated = deduplicateTasks(validTasks);

  // If we only got one task but the input clearly has multiple action verbs or separators, try aggressive split
  if (deduplicated.length === 1 && (hasMultipleSeparators(text) || hasMultipleActionVerbs(text))) {
    const aggressiveTasks = aggressiveSplit(text);
    if (aggressiveTasks.length > 1) {
      return deduplicateTasks(aggressiveTasks);
    }
  }

  // If we got no tasks but have text, return the whole thing as one task
  if (deduplicated.length === 0 && text.trim().length > 0) {
    const cleaned = cleanTaskText(text);
    if (cleaned.length > 0) {
      return [cleaned];
    }
  }

  return deduplicated;
}

/**
 * Normalizes a single line for speech-to-text patterns:
 * - Removes filler phrases like "I need to", "I should", "I want to"
 * - Normalizes repeated connectors
 * - Cleans up whitespace (but NOT newlines, since we work line-by-line)
 */
function normalizeLineForSpeech(line: string): string {
  let normalized = line;

  // Remove common speech lead-in phrases (case-insensitive)
  const leadInPatterns = [
    /^I need to\s+/gi,
    /^I should\s+/gi,
    /^I want to\s+/gi,
    /^I have to\s+/gi,
    /^I must\s+/gi,
    /^I'd like to\s+/gi,
    /^I would like to\s+/gi,
    /^Let me\s+/gi,
    /^Let's\s+/gi,
    /^We need to\s+/gi,
    /^We should\s+/gi,
  ];

  for (const pattern of leadInPatterns) {
    normalized = normalized.replace(pattern, '');
  }

  // Normalize repeated connectors (e.g., "and and" -> "and")
  normalized = normalized.replace(/\b(and|then|also|next)\s+\1\b/gi, '$1');

  // Normalize whitespace within the line (spaces, tabs) but NOT newlines
  normalized = normalized.replace(/[ \t]+/g, ' ').trim();

  return normalized;
}

/**
 * Cleans task text by removing artifacts and normalizing whitespace
 */
function cleanTaskText(text: string): string {
  let cleaned = text.trim();
  
  // Remove bullet/number prefixes that might have been missed
  cleaned = cleaned.replace(/^[•\-*+]\s*/, '');
  cleaned = cleaned.replace(/^\d+[\.\):\-]\s*/, '');
  
  // Remove leading connectors that might have been left over
  cleaned = cleaned.replace(/^(and|then|also|next|after that|first|second|third|last|finally)\s+/gi, '');
  
  // Remove trailing punctuation that doesn't add meaning
  cleaned = cleaned.replace(/[,;]+$/, '');
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  return cleaned.trim();
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
    (text.match(/\s+next\s+/gi) || []).length +
    (text.match(/\s+also\s+/gi) || []).length +
    (text.match(/,\s*and\s+/gi) || []).length;
  
  return separatorCount >= 2;
}

/**
 * More aggressive splitting when we detect the user intended multiple tasks
 */
function aggressiveSplit(text: string): string[] {
  const tasks: string[] = [];
  
  // Split by newlines and semicolons first
  const lines = text.split(/[\n;]/).map(s => s.trim()).filter(s => s.length > 0);
  
  for (const line of lines) {
    // Normalize each line individually
    const normalized = normalizeLineForSpeech(line);
    
    // Remove bullet/number prefixes
    let cleaned = normalized.replace(/^[•\-*+]\s*/, '').trim();
    cleaned = cleaned.replace(/^\d+[\.\):\-]\s*/, '').trim();
    
    if (!cleaned) continue;
    
    // Try splitting by conjunctions and commas more aggressively
    const split = splitMultiTaskSentence(cleaned, true);
    tasks.push(...split);
  }
  
  return tasks
    .map(task => cleanTaskText(task))
    .filter(task => task.length > 0 && isValidTaskSegment(task));
}

/**
 * Splits a sentence that contains multiple tasks joined by conjunctions.
 * Uses smart heuristics to identify task boundaries.
 * @param text - The text to split
 * @param aggressive - If true, uses more aggressive splitting rules
 */
function splitMultiTaskSentence(text: string, aggressive: boolean = false): string[] {
  // Speech connector patterns that indicate task boundaries (ordered by specificity)
  const separatorPatterns = [
    { pattern: /,\s*and then\s+/gi, name: 'comma-and-then' },
    { pattern: /,\s*then\s+/gi, name: 'comma-then' },
    { pattern: /\s+and then\s+/gi, name: 'and-then' },
    { pattern: /\s+after that\s+/gi, name: 'after-that' },
    { pattern: /,\s*after that\s+/gi, name: 'comma-after-that' },
    { pattern: /\s+then\s+/gi, name: 'then' },
    { pattern: /\s+also\s+/gi, name: 'also' },
    { pattern: /,\s*also\s+/gi, name: 'comma-also' },
    { pattern: /\s+and also\s+/gi, name: 'and-also' },
    { pattern: /\s+next\s+/gi, name: 'next' },
    { pattern: /,\s*next\s+/gi, name: 'comma-next' },
    { pattern: /\s+first\s+/gi, name: 'first' },
    { pattern: /\s+second\s+/gi, name: 'second' },
    { pattern: /\s+third\s+/gi, name: 'third' },
    { pattern: /\s+last\s+/gi, name: 'last' },
    { pattern: /\s+finally\s+/gi, name: 'finally' },
  ];

  let segments: string[] = [text];

  // Try each separator pattern
  for (const { pattern } of separatorPatterns) {
    const newSegments: string[] = [];
    
    for (const segment of segments) {
      const parts = segment.split(pattern);
      
      // Split if we get multiple parts and they look reasonable
      if (parts.length > 1) {
        const validParts = parts.map(p => p.trim()).filter(p => p.length > 0);
        
        // In aggressive mode or if all parts are valid, accept the split
        if (aggressive || validParts.every(part => isValidTaskSegment(part))) {
          newSegments.push(...validParts);
        } else {
          newSegments.push(segment);
        }
      } else {
        newSegments.push(segment);
      }
    }
    
    segments = newSegments;
  }

  // Try splitting by comma-separated sequences if we detect multiple action verbs
  if (aggressive || hasMultipleActionVerbs(text)) {
    const commaSegments: string[] = [];
    
    for (const segment of segments) {
      // Split by commas
      const commaParts = segment.split(/,\s+/);
      
      if (commaParts.length > 1) {
        const validParts = commaParts.map(p => p.trim()).filter(p => p.length > 0);
        
        // If most parts are strong tasks, accept the split
        const strongParts = validParts.filter(part => isStrongTaskSegment(part));
        if (strongParts.length >= Math.ceil(validParts.length * 0.6)) {
          commaSegments.push(...validParts.filter(p => isValidTaskSegment(p)));
        } else {
          commaSegments.push(segment);
        }
      } else {
        commaSegments.push(segment);
      }
    }
    
    segments = commaSegments;
  }

  // Try splitting by " and " if both sides are clearly standalone tasks
  if (segments.length === 1 && segments[0].includes(' and ')) {
    const andParts = segments[0].split(/\s+and\s+/i);
    
    if (andParts.length === 2 && andParts.every(part => isStrongTaskSegment(part.trim()))) {
      // Two strong tasks separated by "and" - split them
      segments = andParts.map(p => p.trim()).filter(p => p.length > 0);
    } else if (andParts.length > 2) {
      // Multiple "and" connectors - check if we should split
      const validParts = andParts.map(p => p.trim()).filter(p => p.length > 0);
      const strongParts = validParts.filter(part => isStrongTaskSegment(part));
      
      // If most parts are strong tasks, split them
      if (strongParts.length >= Math.ceil(validParts.length * 0.6)) {
        segments = validParts.filter(p => isValidTaskSegment(p));
      }
    }
  }

  return segments.filter(seg => seg.length > 0);
}

/**
 * Checks if text contains multiple action verbs, indicating multiple tasks
 */
function hasMultipleActionVerbs(text: string): boolean {
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
    'submit', 'approve', 'reject', 'validate', 'verify', 'confirm', 'pay',
    'book', 'reserve', 'order', 'purchase', 'return', 'cancel', 'reschedule',
    'attend', 'visit', 'go', 'come', 'arrive', 'leave', 'start', 'stop',
    'open', 'close', 'lock', 'unlock', 'turn', 'switch', 'change', 'adjust'
  ];

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  let actionCount = 0;
  for (const word of words) {
    // Check if word starts with an action word (handles "emailing", "scheduled", etc.)
    const isAction = actionWords.some(action => word.startsWith(action));
    if (isAction) {
      actionCount++;
      if (actionCount >= 2) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Checks if a text segment looks like a valid standalone task.
 * Avoids creating fragments that are too short or don't resemble actions.
 */
function isValidTaskSegment(text: string): boolean {
  // Must have minimum length (at least a few characters)
  if (text.length < 3) {
    return false;
  }

  // Must have at least 2 words for most cases, or 1 word if it's long enough
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 1) {
    return false;
  }

  // Single word must be at least 4 characters (e.g., "call", "email", "test")
  if (words.length === 1 && words[0].length < 4) {
    return false;
  }

  // Should not be just a trailing fragment (e.g., "it", "that", "this")
  const firstWord = words[0].toLowerCase();
  const fragmentWords = ['it', 'that', 'this', 'them', 'those', 'these', 'the', 'a', 'an', 'and', 'or', 'but'];
  if (words.length === 1 && fragmentWords.includes(firstWord)) {
    return false;
  }

  // Should not be just pronouns or articles
  if (words.length <= 2 && words.every(w => fragmentWords.includes(w.toLowerCase()))) {
    return false;
  }

  // Should not be just connector words
  const connectorWords = ['then', 'also', 'next', 'after', 'before', 'first', 'second', 'last'];
  if (words.length === 1 && connectorWords.includes(firstWord)) {
    return false;
  }

  return true;
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
  
  // Must start with an action word or be a clear noun phrase (2+ words)
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
    'submit', 'approve', 'reject', 'validate', 'verify', 'confirm', 'pay',
    'book', 'reserve', 'order', 'purchase', 'return', 'cancel', 'reschedule',
    'attend', 'visit', 'go', 'come', 'arrive', 'leave', 'start', 'stop',
    'open', 'close', 'lock', 'unlock', 'turn', 'switch', 'change', 'adjust'
  ];

  // Check if first word starts with an action word (handles verb forms)
  const startsWithAction = actionWords.some(action => firstWord.startsWith(action));
  
  return startsWithAction || words.length >= 2;
}

/**
 * Removes near-duplicate tasks from the list
 */
function deduplicateTasks(tasks: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const task of tasks) {
    const normalized = task.toLowerCase().trim();
    
    // Check for exact duplicates
    if (seen.has(normalized)) {
      continue;
    }

    // Check for near-duplicates (one is a substring of another)
    let isDuplicate = false;
    for (const existing of seen) {
      if (normalized.includes(existing) || existing.includes(normalized)) {
        // Keep the longer, more descriptive version
        if (normalized.length > existing.length) {
          // Remove the shorter version and add the longer one
          const index = result.findIndex(t => t.toLowerCase().trim() === existing);
          if (index !== -1) {
            result[index] = task;
            seen.delete(existing);
            seen.add(normalized);
          }
        }
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.add(normalized);
      result.push(task);
    }
  }

  return result;
}
