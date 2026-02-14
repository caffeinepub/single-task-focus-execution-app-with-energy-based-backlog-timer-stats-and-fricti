// Local deterministic task energy classifier
// No external AI/LLM calls - works offline

export type EnergyCategory = 'DEEP' | 'STEADY' | 'LOW' | 'NONE';

export interface ClassificationResult {
  category: EnergyCategory;
  explanation: string;
  confidence: 'high' | 'medium' | 'low';
}

// Keywords and patterns for classification
const DEEP_FOCUS_KEYWORDS = [
  'design', 'architect', 'plan', 'strategy', 'research', 'analyze', 'create',
  'write', 'develop', 'solve', 'complex', 'algorithm', 'brainstorm', 'innovate',
  'conceptualize', 'prototype', 'refactor', 'optimize', 'debug', 'learn'
];

const STEADY_WORK_KEYWORDS = [
  'implement', 'build', 'code', 'test', 'review', 'document', 'update',
  'fix', 'configure', 'setup', 'integrate', 'deploy', 'migrate', 'prepare',
  'organize', 'coordinate', 'schedule', 'meeting', 'call', 'presentation'
];

const LOW_ENERGY_KEYWORDS = [
  'read', 'check', 'review', 'respond', 'reply', 'email', 'message',
  'browse', 'watch', 'listen', 'follow up', 'monitor', 'track', 'update status',
  'light', 'simple', 'quick', 'easy', 'routine'
];

const NO_BRAIN_KEYWORDS = [
  'file', 'sort', 'clean', 'organize files', 'delete', 'archive', 'backup',
  'copy', 'paste', 'format', 'rename', 'move', 'download', 'upload',
  'mindless', 'repetitive', 'mechanical', 'administrative', 'data entry'
];

// Time estimation patterns
const TIME_PATTERNS = {
  quick: /\b(quick|fast|5\s*min|10\s*min|brief)\b/i,
  medium: /\b(30\s*min|hour|1\s*hr)\b/i,
  long: /\b(2\s*hr|3\s*hr|half\s*day|full\s*day|several\s*hours)\b/i,
};

// Complexity indicators
const COMPLEXITY_INDICATORS = {
  high: /\b(complex|difficult|challenging|advanced|deep|critical|important)\b/i,
  low: /\b(simple|easy|basic|straightforward|routine|trivial)\b/i,
};

function countKeywordMatches(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  return keywords.filter(keyword => lowerText.includes(keyword)).length;
}

function analyzeComplexity(text: string): 'high' | 'medium' | 'low' {
  if (COMPLEXITY_INDICATORS.high.test(text)) return 'high';
  if (COMPLEXITY_INDICATORS.low.test(text)) return 'low';
  return 'medium';
}

function analyzeTimeEstimate(text: string): 'quick' | 'medium' | 'long' | null {
  if (TIME_PATTERNS.quick.test(text)) return 'quick';
  if (TIME_PATTERNS.long.test(text)) return 'long';
  if (TIME_PATTERNS.medium.test(text)) return 'medium';
  return null;
}

export function classifyTaskEnergy(taskText: string): ClassificationResult | { error: string } {
  // Validate input
  const trimmedText = taskText.trim();
  if (!trimmedText) {
    return { error: 'Please enter a task description to get a category suggestion.' };
  }

  if (trimmedText.length < 3) {
    return { error: 'Please provide a more detailed task description (at least a few words).' };
  }

  // Count keyword matches for each category
  const deepScore = countKeywordMatches(trimmedText, DEEP_FOCUS_KEYWORDS);
  const steadyScore = countKeywordMatches(trimmedText, STEADY_WORK_KEYWORDS);
  const lowScore = countKeywordMatches(trimmedText, LOW_ENERGY_KEYWORDS);
  const noBrainScore = countKeywordMatches(trimmedText, NO_BRAIN_KEYWORDS);

  // Analyze additional signals
  const complexity = analyzeComplexity(trimmedText);
  const timeEstimate = analyzeTimeEstimate(trimmedText);

  // Calculate weighted scores
  let scores = {
    DEEP: deepScore,
    STEADY: steadyScore,
    LOW: lowScore,
    NONE: noBrainScore,
  };

  // Adjust scores based on complexity
  if (complexity === 'high') {
    scores.DEEP += 2;
    scores.STEADY += 1;
  } else if (complexity === 'low') {
    scores.LOW += 1;
    scores.NONE += 2;
  }

  // Adjust scores based on time estimate
  if (timeEstimate === 'quick') {
    scores.LOW += 1;
    scores.NONE += 1;
  } else if (timeEstimate === 'long') {
    scores.DEEP += 1;
    scores.STEADY += 1;
  }

  // Find the category with highest score
  const maxScore = Math.max(...Object.values(scores));
  const topCategories = (Object.keys(scores) as EnergyCategory[]).filter(
    key => scores[key] === maxScore
  );

  // Determine confidence
  let confidence: 'high' | 'medium' | 'low';
  if (maxScore >= 3) {
    confidence = 'high';
  } else if (maxScore >= 1) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // If there's a tie or no clear winner, use heuristics
  let category: EnergyCategory;
  let explanation: string;

  if (topCategories.length === 1 && maxScore > 0) {
    category = topCategories[0];
    explanation = generateExplanation(category, trimmedText, complexity, timeEstimate, confidence);
  } else {
    // Fallback heuristics when no clear match
    if (complexity === 'high') {
      category = 'DEEP';
      explanation = `This seems like a complex task requiring focused thinking. Best guess based on the complexity level.`;
      confidence = 'low';
    } else if (timeEstimate === 'quick') {
      category = 'LOW';
      explanation = `This appears to be a quick task. Best guess based on the time estimate.`;
      confidence = 'low';
    } else if (trimmedText.length < 20) {
      category = 'NONE';
      explanation = `This seems like a simple, straightforward task. Best guess based on the brief description.`;
      confidence = 'low';
    } else {
      category = 'STEADY';
      explanation = `This looks like regular productive work. Best guess - consider adding more details for a better suggestion.`;
      confidence = 'low';
    }
  }

  return { category, explanation, confidence };
}

function generateExplanation(
  category: EnergyCategory,
  text: string,
  complexity: 'high' | 'medium' | 'low',
  timeEstimate: 'quick' | 'medium' | 'long' | null,
  confidence: 'high' | 'medium' | 'low'
): string {
  const explanations: Record<EnergyCategory, string[]> = {
    DEEP: [
      'This task involves complex thinking, creativity, or problem-solving',
      'Requires deep concentration and mental energy',
      'Best tackled when you have uninterrupted focus time',
    ],
    STEADY: [
      'This is regular productive work that needs consistent attention',
      'Requires steady focus but not necessarily peak mental energy',
      'Good for your normal working hours',
    ],
    LOW: [
      'This is a meaningful but lighter task',
      'Can be done when your energy is lower',
      'Good for times when you need to stay productive but feel less energized',
    ],
    NONE: [
      'This is a simple, mechanical task',
      'Requires minimal mental effort',
      'Perfect for when you need to stay busy but your brain needs a break',
    ],
  };

  let explanation = explanations[category][0];

  // Add context based on signals
  if (complexity === 'high' && category === 'DEEP') {
    explanation += ' due to its complexity';
  } else if (timeEstimate === 'quick' && (category === 'LOW' || category === 'NONE')) {
    explanation += ' and should be quick to complete';
  } else if (timeEstimate === 'long' && (category === 'DEEP' || category === 'STEADY')) {
    explanation += ' and may take significant time';
  }

  // Add confidence qualifier
  if (confidence === 'low') {
    explanation = `Best guess: ${explanation}. Consider adding more details for a better suggestion.`;
  } else if (confidence === 'medium') {
    explanation += '.';
  } else {
    explanation += '.';
  }

  return explanation;
}
