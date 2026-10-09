import { Issue, IIssue } from '../models/Issue';
import { IssueCategory } from '../types';

const STOP_WORDS = new Set([
  'the', 'is', 'in', 'at', 'on', 'of', 'and', 'a', 'an', 'to', 'for', 'with', 'from',
  'it', 'its', 'my', 'this', 'that', 'there', 'has', 'have', 'are', 'was', 'were', 'been',
  'be', 'not', 'no', 'very', 'too', 'room', 'block', 'floor'
]);

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  similarityScore: number;
  matchedIssue: IIssue | null;
  message?: string;
}

export async function detectDuplicateIssue(params: {
  title: string;
  category: IssueCategory;
  location: string;
  description?: string;
  excludeId?: string;
}): Promise<DuplicateDetectionResult> {
  const { title, category, location, description = '', excludeId } = params;

  // Search unresolved issues in the same category
  const query: any = {
    category,
    status: { $in: ['Reported', 'Assigned', 'In Progress'] },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const candidateIssues = await Issue.find(query).populate('reportedBy', 'name email');

  if (candidateIssues.length === 0) {
    return { isDuplicate: false, similarityScore: 0, matchedIssue: null };
  }

  const inputLocationTokens = tokenize(location);
  const inputTitleTokens = tokenize(title + ' ' + description);

  let bestMatch: IIssue | null = null;
  let highestScore = 0;

  for (const candidate of candidateIssues) {
    // 1. Check Location similarity
    const candidateLocationTokens = tokenize(candidate.location);
    const locationScore = calculateJaccardSimilarity(inputLocationTokens, candidateLocationTokens);

    // Direct substring check on location (e.g. "Room 204" in "Block A Room 204")
    const locA = location.toLowerCase().trim();
    const locB = candidate.location.toLowerCase().trim();
    const locationExactOrSubstring = locA === locB || locA.includes(locB) || locB.includes(locA);

    if (!locationExactOrSubstring && locationScore < 0.2) {
      // Must be in a comparable location to be considered a duplicate
      continue;
    }

    // 2. Check Title & Description similarity
    const candidateTitleTokens = tokenize(candidate.title + ' ' + candidate.description);
    const titleScore = calculateJaccardSimilarity(inputTitleTokens, candidateTitleTokens);

    // Boost score if location is an exact match
    const compositeScore = (titleScore * 0.7) + ((locationExactOrSubstring ? 1.0 : locationScore) * 0.3);

    if (compositeScore > highestScore) {
      highestScore = compositeScore;
      bestMatch = candidate;
    }
  }

  // Threshold: if score is >= 0.35, suggest Me Too
  if (bestMatch && highestScore >= 0.35) {
    return {
      isDuplicate: true,
      similarityScore: Math.round(highestScore * 100),
      matchedIssue: bestMatch,
      message: `A similar issue already exists: "${bestMatch.title}" at ${bestMatch.location} (${bestMatch.upvoters.length} upvotes). You can tap "Me Too" to upvote it!`,
    };
  }

  return {
    isDuplicate: false,
    similarityScore: Math.round(highestScore * 100),
    matchedIssue: null,
  };
}
