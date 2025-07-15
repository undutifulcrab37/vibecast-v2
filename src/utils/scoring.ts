import { Episode, Mood, Theme, ScoredEpisode } from '../types';
import { ratingService } from '../services/ratingService';
import { getCategoriesForUserSelection } from './categoryMapping';

// Enhanced scoring interfaces
interface EnhancedScoringFactors {
  semanticMatch: number;      // 0-1 similarity score
  categoryRelevance: number;  // Weighted category matches
  qualitySignals: number;     // Popularity, recency, etc.
  personalFit: number;        // User-specific preferences
  diversityBonus: number;     // Variety from recent recommendations
  durationScore: number;      // Smart duration matching
}

interface UserListeningHistory {
  recentEpisodes: string[];   // Episode IDs from last sessions
  skipPatterns: string[];     // Keywords from skipped episodes
  completedEpisodes: string[]; // Episode IDs that were finished
}

// Store recent recommendations for diversity
let recentRecommendations: string[] = [];
const MAX_RECENT_HISTORY = 20;

// Legacy keyword maps - keeping for fallback scoring only
export const vibeKeywordMap: Record<Mood, string[]> = {
  happy: ['uplifting', 'joy', 'funny', 'positive', 'feel good', 'comedy', 'humor', 'laugh', 'optimistic'],
  sad: ['empathy', 'healing', 'grief', 'storytelling', 'emotions', 'melancholy', 'support', 'comfort'],
  anxious: ['calm', 'soothing', 'mindfulness', 'meditation', 'relax', 'peaceful', 'tranquil', 'breathing'],
  bored: ['banter', 'entertaining', 'weird', 'viral', 'surprising', 'quirky', 'unusual', 'fascinating'],
  curious: ['learning', 'explainer', 'interview', 'science', 'ideas', 'discovery', 'research', 'explore'],
  tired: ['soft voice', 'chill', 'low energy', 'slow paced', 'gentle', 'mellow', 'quiet', 'sleepy'],
  focused: ['productivity', 'deep dive', 'motivation', 'workflow', 'concentration', 'analysis', 'detailed'],
  stressed: ['relaxing', 'coping', 'unwind', 'decompress', 'stress relief', 'self-care', 'balance'],
  surprise_me: ['unexpected', 'random', 'eclectic', 'variety', 'diverse', 'mix'],
  dont_know: ['popular', 'trending', 'recommended', 'well-rated', 'mainstream'],
};

export const themeKeywordMap: Record<Theme, string[]> = {
  laugh: ['comedy', 'banter', 'funny', 'sketch', 'humor', 'jokes', 'hilarious', 'wit'],
  cry: ['moving', 'emotional', 'true story', 'family', 'touching', 'heartfelt', 'personal'],
  learn: ['education', 'explainer', 'deep dive', 'how to', 'tutorial', 'knowledge', 'facts'],
  be_inspired: ['motivation', 'success', 'resilience', 'achievement', 'growth', 'inspiration'],
  escape: ['thriller', 'fiction', 'mystery', 'narrative', 'adventure', 'fantasy', 'drama'],
  chill: ['calm', 'ambient', 'meditation', 'soft spoken', 'peaceful', 'relaxed', 'zen'],
  be_distracted: ['random', 'light', 'banter', 'entertaining', 'casual', 'fun', 'easy'],
  be_shocked: ['true crime', 'scandal', 'unbelievable', 'twist', 'shocking', 'revelation'],
  reflect: ['introspective', 'life', 'meaning', 'mental health', 'philosophy', 'thoughtful'],
  stay_updated: ['news', 'current events', 'culture', 'politics', 'trends', 'analysis'],
  feel_seen: ['identity', 'relationships', 'personal stories', 'community', 'belonging'],
  kill_time: ['facts', 'trivia', 'low effort', 'background', 'casual', 'easy listening'],
};

// Semantic similarity scoring using enhanced text analysis
function calculateSemanticSimilarity(
  episode: Episode,
  userMoods: Mood[],
  userThemes: Theme[]
): number {
  const episodeText = `${episode.title} ${episode.description} ${episode.podcast_name}`.toLowerCase();
  
  // Get all relevant keywords for user's selection
  const moodKeywords = userMoods.flatMap(mood => vibeKeywordMap[mood] || []);
  const themeKeywords = userThemes.flatMap(theme => themeKeywordMap[theme] || []);
  const allKeywords = [...moodKeywords, ...themeKeywords];
  
  if (allKeywords.length === 0) return 0;
  
  // Calculate semantic matches with proximity scoring
  let semanticScore = 0;
  let totalPossibleMatches = allKeywords.length;
  
  allKeywords.forEach(keyword => {
    if (episodeText.includes(keyword.toLowerCase())) {
      // Exact match gets full points
      semanticScore += 1;
    } else {
      // Check for partial/semantic matches
      const keywordParts = keyword.split(' ');
      const partialMatches = keywordParts.filter(part => 
        part.length > 3 && episodeText.includes(part.toLowerCase())
      );
      if (partialMatches.length > 0) {
        semanticScore += (partialMatches.length / keywordParts.length) * 0.5;
      }
    }
  });
  
  return Math.min(1, semanticScore / totalPossibleMatches);
}

// Enhanced content quality scoring
function calculateQualitySignals(episode: Episode): number {
  let qualityScore = 0;
  
  // Recency scoring with decay curve
  if (episode.published_at) {
    const publishedDate = new Date(episode.published_at);
    const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSincePublished < 7) {
      qualityScore += 0.3; // Very recent
    } else if (daysSincePublished < 30) {
      qualityScore += 0.2; // Recent
    } else if (daysSincePublished < 90) {
      qualityScore += 0.1; // Somewhat recent
    }
  }
  
  // Content quality indicators
  const description = episode.description?.toLowerCase() || '';
  const title = episode.title?.toLowerCase() || '';
  
  // Bonus for detailed descriptions
  if (description.length > 200) {
    qualityScore += 0.1;
  }
  
  // Bonus for professional titles (not all caps, proper length)
  if (episode.title.length > 10 && episode.title.length < 100 && 
      episode.title !== episode.title.toUpperCase()) {
    qualityScore += 0.1;
  }
  
  // Penalty for spam indicators
  if (description.includes('subscribe') && description.includes('like') && 
      description.includes('follow')) {
    qualityScore -= 0.2;
  }
  
  return Math.max(0, qualityScore);
}

// Smart duration scoring with flexible preferences
function calculateDurationScore(episode: Episode, maxDuration: number): number {
  const durationMinutes = Math.floor(episode.audio_length_sec / 60);
  const durationDifference = Math.abs(durationMinutes - maxDuration);
  
  // Perfect match zone (within 2 minutes)
  if (durationDifference <= 2) {
    return 1.0;
  }
  
  // Excellent match zone (within 5 minutes)
  if (durationDifference <= 5) {
    return 0.8;
  }
  
  // Good match zone (within 10 minutes)
  if (durationDifference <= 10) {
    return 0.6;
  }
  
  // Acceptable match zone (within 15 minutes)
  if (durationDifference <= 15) {
    return 0.4;
  }
  
  // Still acceptable for longer content if user requested longer episodes
  if (durationMinutes > maxDuration && maxDuration > 60) {
    return 0.3; // Longer episodes get some tolerance for long-form content lovers
  }
  
  // Poor match
  return 0.1;
}

// Diversity bonus to prevent repetitive recommendations
function calculateDiversityBonus(episode: Episode): number {
  if (recentRecommendations.includes(episode.id)) {
    return -0.5; // Penalty for recent recommendations
  }
  
  // Bonus for podcast variety
  const recentPodcasts = recentRecommendations.map(id => 
    // This would need actual episode lookup, simplified for now
    episode.podcast_name
  );
  
  if (!recentPodcasts.includes(episode.podcast_name)) {
    return 0.2; // Bonus for podcast diversity
  }
  
  return 0;
}

// Enhanced category scoring with weighted importance
function scoreByCategoryMatch(
  episode: Episode,
  userMoods: Mood[],
  userThemes: Theme[]
): { score: number; matchReasons: string[] } {
  const categories = getCategoriesForUserSelection(userMoods, userThemes);
  const episodeText = `${episode.title} ${episode.description} ${episode.podcast_name}`.toLowerCase();
  
  let score = 0;
  const matchReasons: string[] = [];

  // Score primary category matches (highest weight)
  let primaryMatches = 0;
  categories.primary.forEach(category => {
    if (episodeText.includes(category.toLowerCase())) {
      score += 15; // Increased from 10
      primaryMatches++;
    }
  });
  
  if (primaryMatches > 0) {
    matchReasons.push(`Perfect match for your vibe (${primaryMatches} primary categories)`);
  }

  // Score secondary category matches (medium weight)
  let secondaryMatches = 0;
  categories.secondary.forEach(category => {
    if (episodeText.includes(category.toLowerCase())) {
      score += 8; // Increased from 6
      secondaryMatches++;
    }
  });
  
  if (secondaryMatches > 0) {
    matchReasons.push(`Good match for your preferences (${secondaryMatches} secondary categories)`);
  }

  // Score subcategory matches (lower weight but still important)
  let subcategoryMatches = 0;
  categories.subcategories.forEach(subcategory => {
    if (episodeText.includes(subcategory.toLowerCase())) {
      score += 5; // Increased from 4
      subcategoryMatches++;
    }
  });
  
  if (subcategoryMatches > 0) {
    matchReasons.push(`Matches specific interests (${subcategoryMatches} subcategories)`);
  }

  return { score, matchReasons };
}

// Fallback keyword scoring (reduced weight)
function scoreByKeywordMatch(
  episode: Episode,
  userMoods: Mood[],
  userThemes: Theme[]
): { score: number; matchReasons: string[] } {
  const text = `${episode.title} ${episode.description}`.toLowerCase();
  let score = 0;
  const matchReasons: string[] = [];

  // Score mood matches (reduced weight)
  userMoods.forEach(mood => {
    const moodKeywords = vibeKeywordMap[mood] || [];
    const matchedKeywords = moodKeywords.filter(keyword => text.includes(keyword.toLowerCase()));
    if (matchedKeywords.length > 0) {
      score += matchedKeywords.length * 1; // Reduced from 2
      matchReasons.push(`Keywords match your ${mood} mood (${matchedKeywords.join(', ')})`);
    }
  });

  // Score theme matches (reduced weight)
  userThemes.forEach(theme => {
    const themeKeywords = themeKeywordMap[theme] || [];
    const matchedKeywords = themeKeywords.filter(keyword => text.includes(keyword.toLowerCase()));
    if (matchedKeywords.length > 0) {
      score += matchedKeywords.length * 1.5; // Reduced from 3
      matchReasons.push(`Keywords for ${theme.replace('_', ' ')} (${matchedKeywords.join(', ')})`);
    }
  });

  return { score, matchReasons };
}

export async function scoreEpisode(
  episode: Episode,
  userMoods: Mood[],
  userThemes: Theme[],
  maxDuration: number
): Promise<ScoredEpisode> {
  const matchReasons: string[] = [];

  // Calculate all scoring factors
  const scoringFactors: EnhancedScoringFactors = {
    semanticMatch: calculateSemanticSimilarity(episode, userMoods, userThemes),
    categoryRelevance: 0, // Will be set below
    qualitySignals: calculateQualitySignals(episode),
    personalFit: 0, // Will be enhanced with rating data
    diversityBonus: calculateDiversityBonus(episode),
    durationScore: calculateDurationScore(episode, maxDuration)
  };

  // Primary scoring: Category-based matching (highest priority)
  const categoryScoring = scoreByCategoryMatch(episode, userMoods, userThemes);
  scoringFactors.categoryRelevance = categoryScoring.score / 20; // Normalize to 0-1
  matchReasons.push(...categoryScoring.matchReasons);

  // Secondary scoring: Keyword-based matching (fallback, lower weight)
  const keywordScoring = scoreByKeywordMatch(episode, userMoods, userThemes);
  const keywordScore = keywordScoring.score / 10; // Normalize
  matchReasons.push(...keywordScoring.matchReasons);

  // Personal fit scoring with rating data
  try {
    const ratingBonus = await ratingService.getEpisodeRatingBonus(episode.id, userMoods, userThemes);
    scoringFactors.personalFit = Math.max(0, ratingBonus / 2); // Normalize to 0-1 range
    if (ratingBonus > 0) {
      matchReasons.push('Highly rated by users with similar preferences');
    }
  } catch (error) {
    console.error('Error getting rating bonus:', error);
    scoringFactors.personalFit = 0;
  }

  // Calculate weighted final score
  const weights = {
    semantic: 25,      // Semantic similarity is crucial
    category: 30,      // Category matching is most important
    quality: 15,       // Quality signals matter
    personal: 20,      // Personal fit is very important
    diversity: 5,      // Diversity bonus/penalty
    duration: 25,      // Duration matching is critical
    keyword: 10        // Keyword fallback has lower weight
  };

  const finalScore = 
    (scoringFactors.semanticMatch * weights.semantic) +
    (scoringFactors.categoryRelevance * weights.category) +
    (scoringFactors.qualitySignals * weights.quality) +
    (scoringFactors.personalFit * weights.personal) +
    (scoringFactors.diversityBonus * weights.diversity) +
    (scoringFactors.durationScore * weights.duration) +
    (keywordScore * weights.keyword);

  // Add duration explanation
  const durationMinutes = Math.floor(episode.audio_length_sec / 60);
  const durationDifference = Math.abs(durationMinutes - maxDuration);
  
  if (durationDifference <= 2) {
    matchReasons.push(`Perfect length at ${durationMinutes} minutes`);
  } else if (durationDifference <= 5) {
    matchReasons.push(`Great length at ${durationMinutes} minutes`);
  } else if (durationDifference <= 10) {
    matchReasons.push(`Good length at ${durationMinutes} minutes`);
  } else {
    matchReasons.push(`${durationMinutes} minutes (${durationDifference} min from target)`);
  }

  // Add semantic and quality insights
  if (scoringFactors.semanticMatch > 0.7) {
    matchReasons.push('Excellent semantic match for your preferences');
  } else if (scoringFactors.semanticMatch > 0.4) {
    matchReasons.push('Good semantic match for your interests');
  }

  if (scoringFactors.qualitySignals > 0.3) {
    matchReasons.push('High quality content indicators');
  }

  const matchReason = matchReasons.length > 0 
    ? matchReasons.join(' • ') 
    : 'General match based on your preferences';

  return {
    ...episode,
    score: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
    matchReason,
  };
}

export async function rankEpisodes(
  episodes: Episode[],
  userMoods: Mood[],
  userThemes: Theme[],
  maxDuration: number
): Promise<ScoredEpisode[]> {
  // Enhanced duration filtering - more flexible approach
  const primaryToleranceMinutes = 15; // Increased tolerance
  const secondaryToleranceMinutes = 25; // Fallback tolerance
  
  const minDurationSeconds = Math.max(0, (maxDuration - primaryToleranceMinutes) * 60);
  const maxDurationSeconds = (maxDuration + primaryToleranceMinutes) * 60;
  
  console.log(`Enhanced filtering: ${maxDuration} minutes (±${primaryToleranceMinutes} min primary range)`);
  
  let filteredEpisodes = episodes.filter(episode => {
    return episode.audio_length_sec >= minDurationSeconds && 
           episode.audio_length_sec <= maxDurationSeconds;
  });
  
  console.log(`Primary filter: ${filteredEpisodes.length}/${episodes.length} episodes`);
  
  // If too few episodes, expand the range
  if (filteredEpisodes.length < 15) {
    console.log(`Expanding to ±${secondaryToleranceMinutes} minutes for more variety`);
    const expandedMinDuration = Math.max(0, (maxDuration - secondaryToleranceMinutes) * 60);
    const expandedMaxDuration = (maxDuration + secondaryToleranceMinutes) * 60;
    
    filteredEpisodes = episodes.filter(episode => 
      episode.audio_length_sec >= expandedMinDuration && 
      episode.audio_length_sec <= expandedMaxDuration
    );
    
    console.log(`Expanded filter: ${filteredEpisodes.length} episodes`);
  }
  
  // Score all episodes in parallel for efficiency
  const scoredEpisodes = await Promise.all(
    filteredEpisodes.map(episode => scoreEpisode(episode, userMoods, userThemes, maxDuration))
  );
  
  // Sort by score (highest first)
  const rankedEpisodes = scoredEpisodes.sort((a, b) => b.score - a.score);
  
  // Update recent recommendations for diversity tracking
  if (rankedEpisodes.length > 0) {
    recentRecommendations.unshift(rankedEpisodes[0].id);
    recentRecommendations = recentRecommendations.slice(0, MAX_RECENT_HISTORY);
  }
  
  console.log(`Final ranking: ${rankedEpisodes.length} episodes scored and ranked`);
  if (rankedEpisodes.length > 0) {
    console.log(`Top episode: "${rankedEpisodes[0].title}" (score: ${rankedEpisodes[0].score})`);
  }
  
  return rankedEpisodes;
}

// Utility function to reset recent recommendations (for testing/new sessions)
export function resetRecommendationHistory(): void {
  recentRecommendations = [];
}

// Utility function to get recommendation diversity stats
export function getRecommendationStats(): { 
  recentCount: number; 
  recentEpisodes: string[] 
} {
  return {
    recentCount: recentRecommendations.length,
    recentEpisodes: recentRecommendations
  };
} 