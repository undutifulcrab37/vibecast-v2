import { Episode, Mood, Theme, ScoredEpisode } from '../types';
import { ratingService } from '../services/ratingService';
import { getCategoriesForUserSelection } from './categoryMapping';

// VibeCast 2.1 Category-focused scoring interfaces
interface CategoryScoringFactors {
  categoryRelevance: number;  // PRIMARY: How well podcast matches selected categories
  qualitySignals: number;     // Content quality indicators
  personalFit: number;        // User-specific preferences
  diversityBonus: number;     // Variety from recent recommendations
  durationScore: number;      // Smart duration matching
  popularityScore: number;    // Spotify popularity + followers
  topQualityBonus: number;    // Quality indicators
}

// Commented out unused interface
// interface UserListeningHistory {
//   episodeId: string;
//   timestamp: number;
//   duration: number;
//   completionRate: number;
// }

// Store recent recommendations for diversity and user session tracking
let recentRecommendations: string[] = [];
let userSessionCount = 0;
let recentSkips = 0;
const MAX_RECENT_HISTORY = 20;

// NEW: Popularity scoring based on Spotify metrics
function calculatePopularityScore(episode: Episode): number {
  let popularityScore = 0;
  
  // Spotify popularity field (0-100)
  if (episode.spotify_popularity) {
    popularityScore += (episode.spotify_popularity / 100) * 0.6; // 60% weight
  }
  
  // Follower count (normalize by category)
  if (episode.follower_count) {
    // Normalize follower count (log scale to prevent huge podcasts dominating)
    const normalizedFollowers = Math.log10(episode.follower_count + 1) / 7; // Assume max ~10M followers
    popularityScore += Math.min(normalizedFollowers, 1) * 0.3; // 30% weight
  }
  
  // Chart position bonus (if available)
  if (episode.chart_position) {
    const chartBonus = Math.max(0, (100 - episode.chart_position) / 100);
    popularityScore += chartBonus * 0.1; // 10% weight
  }
  
  return Math.min(1, popularityScore);
}

// VibeCast 2.1 Updated scoring weights - POPULARITY BOOSTED
const SCORING_WEIGHTS = {
  categoryRelevance: 30,      // ⬇️ Slightly reduced from 40
  durationScore: 20,          // unchanged
  personalFit: 20,            // unchanged
  popularityScore: 35,        // ⬆️ Boosted from 25 for better discovery
  topQualityBonus: 15,        // unchanged
  qualitySignals: 10,         // unchanged
  diversityBonus: 5,          // unchanged
  // REMOVED: semanticMatch and keywordFallback - no more keyword matching
};

// Enhanced category scoring - TRUST SEARCH RESULTS, NO KEYWORD MATCHING
function scoreByCategoryMatch(
  episode: Episode,
  userMoods: Mood[],
  userThemes: Theme[]
): { score: number; matchReasons: string[] } {
  const categories = getCategoriesForUserSelection(userMoods, userThemes);
  
  // Since we're using category-based search, we TRUST that the results are relevant
  // Score based on search result position and quality rather than keyword matching
  
  let score = 0;
  const matchReasons: string[] = [];

  // Base category relevance score - assume all search results are category-relevant
  score += 15; // Base score for being in search results
  
  // Bonus for having detailed metadata (indicates professional podcast)
  if (episode.description && episode.description.length > 100) {
    score += 5;
    matchReasons.push('Professional content quality');
  }
  
  // Bonus for having proper publisher info
  if (episode.publisher && episode.publisher.length > 2) {
    score += 3;
    matchReasons.push('Established publisher');
  }
  
  // Bonus for having cover art (professional production)
  if (episode.cover_art && episode.cover_art.length > 0) {
    score += 2;
    matchReasons.push('Professional presentation');
  }

  // Primary category bonus (assume search results match primary categories)
  if (categories.primary.length > 0) {
    score += 10; // Bonus for primary category match (trust search)
    matchReasons.push(`Matches ${categories.primary.length} primary categories`);
  }

  // Secondary category bonus
  if (categories.secondary.length > 0) {
    score += 5; // Bonus for secondary category match (trust search)
    matchReasons.push(`Matches ${categories.secondary.length} secondary categories`);
  }

  // Trust the search algorithm - no keyword matching needed
  matchReasons.push('Category-based search result');

  return { score, matchReasons };
}

// Enhanced content quality scoring with professional indicators
function calculateQualitySignals(episode: Episode): number {
  let qualityScore = 0;
  
  // Professional artwork & branding
  if (episode.cover_art && episode.cover_art.length > 0) {
    qualityScore += 0.15;
  }
  
  // Complete metadata
  let metadataScore = 0;
  if (episode.title && episode.title.length > 5) metadataScore += 0.25;
  if (episode.description && episode.description.length > 50) metadataScore += 0.25;
  if (episode.publisher && episode.publisher.length > 0) metadataScore += 0.25;
  if (episode.cover_art && episode.cover_art.length > 0) metadataScore += 0.25;
  qualityScore += metadataScore * 0.2;
  
  // Recency bonus (enhanced for <30 days)
  if (episode.published_at) {
    const publishedDate = new Date(episode.published_at);
    const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSincePublished < 7) {
      qualityScore += 0.25; // Very recent
    } else if (daysSincePublished < 30) {
      qualityScore += 0.15; // Recent (enhanced)
    } else if (daysSincePublished < 90) {
      qualityScore += 0.05; // Somewhat recent
    }
  }
  
  // Professional title indicators
  const title = episode.title?.toLowerCase() || '';
  const description = episode.description?.toLowerCase() || '';
  
  // Bonus for proper capitalization and length
  if (episode.title && episode.title.length > 10 && episode.title.length < 100 && 
      episode.title !== episode.title.toUpperCase() && 
      episode.title !== episode.title.toLowerCase()) {
    qualityScore += 0.1;
  }
  
  // Detailed description bonus
  if (description.length > 200) {
    qualityScore += 0.1;
  }
  
  // Professional language indicators
  const professionalIndicators = ['interview', 'episode', 'discussion', 'analysis', 'review', 'deep dive'];
  const professionalMatches = professionalIndicators.filter(indicator => 
    title.includes(indicator) || description.includes(indicator)
  );
  qualityScore += Math.min(0.15, professionalMatches.length * 0.05);
  
  // Penalty for spam indicators
  const spamIndicators = ['subscribe now', 'like and follow', 'click here', 'buy now'];
  const spamMatches = spamIndicators.filter(spam => description.includes(spam));
  qualityScore -= spamMatches.length * 0.1;
  
  return Math.max(0, Math.min(1, qualityScore));
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
    return 0.3;
  }
  
  return 0.1;
}

// Enhanced diversity bonus with skip tracking
function calculateDiversityBonus(episode: Episode): number {
  if (recentRecommendations.includes(episode.id)) {
    return -0.5; // Penalty for recent recommendations
  }
  
  // Bonus for podcast variety
  if (!recentRecommendations.some(_id => episode.podcast_name === episode.podcast_name)) {
    return 0.2;
  }
  
  return 0;
}

// Enhanced personal fit with faster adaptation (windowed average)
async function calculatePersonalFit(
  episode: Episode,
  userMoods: Mood[],
  userThemes: Theme[]
): Promise<number> {
  try {
    // Use windowed average instead of EMA for faster adaptation
    const ratingBonus = await ratingService.getEpisodeRatingBonus(episode.id, userMoods, userThemes);
    
    // Enhanced with completion rate and skip patterns
    const implicitBonus = await ratingService.getImplicitFeedbackBonus(episode.id);
    
    const totalBonus = ratingBonus + implicitBonus;
    return Math.max(0, Math.min(1, totalBonus / 5)); // Normalize to 0-1
  } catch (error) {
    console.error('Error calculating personal fit:', error);
    return 0;
  }
}

export async function scoreEpisode(
  episode: Episode,
  userMoods: Mood[],
  userThemes: Theme[],
  maxDuration: number
): Promise<ScoredEpisode> {
  const matchReasons: string[] = [];

  // Calculate all VibeCast 2.1 scoring factors
  const scoringFactors: CategoryScoringFactors = {
    categoryRelevance: 0, // Will be set below
    qualitySignals: calculateQualitySignals(episode),
    personalFit: await calculatePersonalFit(episode, userMoods, userThemes),
    diversityBonus: calculateDiversityBonus(episode),
    durationScore: calculateDurationScore(episode, maxDuration),
    popularityScore: calculatePopularityScore(episode),
    topQualityBonus: episode.is_top_quality ? 1.0 : 0,
  };

  // Category-based matching
  const categoryScoring = scoreByCategoryMatch(episode, userMoods, userThemes);
  scoringFactors.categoryRelevance = categoryScoring.score / 20;
  matchReasons.push(...categoryScoring.matchReasons);

  // Calculate weighted final score with VibeCast 2.1 weights
  const finalScore = 
    (scoringFactors.categoryRelevance * SCORING_WEIGHTS.categoryRelevance) +
    (scoringFactors.qualitySignals * SCORING_WEIGHTS.qualitySignals) +
    (scoringFactors.personalFit * SCORING_WEIGHTS.personalFit) +
    (scoringFactors.diversityBonus * SCORING_WEIGHTS.diversityBonus) +
    (scoringFactors.durationScore * SCORING_WEIGHTS.durationScore) +
    (scoringFactors.popularityScore * SCORING_WEIGHTS.popularityScore) +
    (scoringFactors.topQualityBonus * SCORING_WEIGHTS.topQualityBonus);

    // DEBUG: Log scoring breakdown for troubleshooting
    console.log(`🎯 Scoring "${episode.title?.substring(0, 50)}...":`, {
      finalScore: Math.round(finalScore * 100) / 100,
      category: Math.round(scoringFactors.categoryRelevance * 100) / 100,
      popularity: Math.round(scoringFactors.popularityScore * 100) / 100,
      quality: Math.round(scoringFactors.qualitySignals * 100) / 100,
      duration: Math.round(scoringFactors.durationScore * 100) / 100,
      personal: Math.round(scoringFactors.personalFit * 100) / 100,
      spotify_popularity: episode.spotify_popularity,
      follower_count: episode.follower_count,
      note: 'CATEGORY-BASED (no keyword matching)'
    });

  // Enhanced match reasoning
  const durationMinutes = Math.floor(episode.audio_length_sec / 60);
  const durationDifference = Math.abs(durationMinutes - maxDuration);
  
  if (durationDifference <= 2) {
    matchReasons.push(`Perfect length at ${durationMinutes} minutes`);
  } else if (durationDifference <= 5) {
    matchReasons.push(`Great length at ${durationMinutes} minutes`);
  } else {
    matchReasons.push(`${durationMinutes} minutes (${durationDifference} min from target)`);
  }

  // Add new scoring insights
  if (scoringFactors.popularityScore > 0.7) {
    matchReasons.push('🔥 Highly popular podcast');
  } else if (scoringFactors.popularityScore > 0.4) {
    matchReasons.push('📈 Popular content');
  }

  if (scoringFactors.categoryRelevance > 0.7) {
    matchReasons.push('🎯 Excellent category match');
  } else if (scoringFactors.categoryRelevance > 0.4) {
    matchReasons.push('✨ Good category match');
  }

  if (scoringFactors.qualitySignals > 0.5) {
    matchReasons.push('⭐ High quality content');
  }

  if (scoringFactors.personalFit > 0.6) {
    matchReasons.push('💝 Personalized for you');
  }

  const matchReason = matchReasons.length > 0 
    ? matchReasons.join(' • ') 
    : 'General match based on your preferences';

  return {
    ...episode,
    score: Math.round(finalScore * 100) / 100,
    matchReason,
  };
}

// Enhanced ranking with better filtering
export async function rankEpisodes(
  episodes: Episode[],
  userMoods: Mood[],
  userThemes: Theme[],
  maxDuration: number
): Promise<ScoredEpisode[]> {
  // Enhanced duration filtering
  const primaryToleranceMinutes = 15;
  const secondaryToleranceMinutes = 25;
  
  const minDurationSeconds = Math.max(0, (maxDuration - primaryToleranceMinutes) * 60);
  const maxDurationSeconds = (maxDuration + primaryToleranceMinutes) * 60;
  
  console.log(`🎯 VibeCast 2.1 filtering: ${maxDuration} minutes (±${primaryToleranceMinutes} min)`);
  
  let filteredEpisodes = episodes.filter(episode => {
    return episode.audio_length_sec >= minDurationSeconds && 
           episode.audio_length_sec <= maxDurationSeconds;
  });
  
  console.log(`📊 Primary filter: ${filteredEpisodes.length}/${episodes.length} episodes`);
  
  // Expand range if needed
  if (filteredEpisodes.length < 15) {
    console.log(`🔄 Expanding to ±${secondaryToleranceMinutes} minutes`);
    const expandedMinDuration = Math.max(0, (maxDuration - secondaryToleranceMinutes) * 60);
    const expandedMaxDuration = (maxDuration + secondaryToleranceMinutes) * 60;
    
    filteredEpisodes = episodes.filter(episode => 
      episode.audio_length_sec >= expandedMinDuration && 
      episode.audio_length_sec <= expandedMaxDuration
    );
    
    console.log(`📈 Expanded filter: ${filteredEpisodes.length} episodes`);
  }
  
  // Score all episodes in parallel
  const scoredEpisodes = await Promise.all(
    filteredEpisodes.map(episode => scoreEpisode(episode, userMoods, userThemes, maxDuration))
  );
  
  // Sort by score (highest first)
  const rankedEpisodes = scoredEpisodes.sort((a, b) => b.score - a.score);
  
  // Update recent recommendations
  if (rankedEpisodes.length > 0) {
    recentRecommendations.unshift(rankedEpisodes[0].id);
    recentRecommendations = recentRecommendations.slice(0, MAX_RECENT_HISTORY);
  }
  
  console.log(`✅ VibeCast 2.1 ranking: ${rankedEpisodes.length} episodes scored`);
  if (rankedEpisodes.length > 0) {
    console.log(`🏆 Top episode: "${rankedEpisodes[0].title}" (score: ${rankedEpisodes[0].score})`);
  }
  
  return rankedEpisodes;
}

// Enhanced session tracking
export function incrementSessionCount(): void {
  userSessionCount++;
}

export function recordSkip(): void {
  recentSkips++;
}

export function resetSkipCount(): void {
  recentSkips = 0;
}

// Utility functions
export function resetRecommendationHistory(): void {
  recentRecommendations = [];
  userSessionCount = 0;
  recentSkips = 0;
}

export function getRecommendationStats(): { 
  recentCount: number; 
  recentEpisodes: string[];
  sessionCount: number;
  recentSkips: number;
} {
  return {
    recentCount: recentRecommendations.length,
    recentEpisodes: recentRecommendations,
    sessionCount: userSessionCount,
    recentSkips: recentSkips
  };
} 