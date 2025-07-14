import { Episode, Mood, Theme, ScoredEpisode } from '../types';
import { ratingService } from '../services/ratingService';

export const vibeKeywordMap: Record<Mood, string[]> = {
  happy: ['uplifting', 'joy', 'funny', 'positive', 'feel good'],
  sad: ['empathy', 'healing', 'grief', 'storytelling', 'emotions'],
  anxious: ['calm', 'soothing', 'mindfulness', 'meditation', 'relax'],
  bored: ['banter', 'entertaining', 'weird', 'viral'],
  curious: ['learning', 'explainer', 'interview', 'science', 'ideas'],
  tired: ['soft voice', 'chill', 'low energy', 'slow paced'],
  focused: ['productivity', 'deep dive', 'motivation', 'workflow'],
  stressed: ['relaxing', 'coping', 'unwind', 'decompress'],
  surprise_me: [],
  dont_know: [],
};

export const themeKeywordMap: Record<Theme, string[]> = {
  laugh: ['comedy', 'banter', 'funny', 'sketch'],
  cry: ['moving', 'emotional', 'true story', 'family'],
  learn: ['education', 'explainer', 'deep dive', 'how to'],
  be_inspired: ['motivation', 'success', 'resilience'],
  escape: ['thriller', 'fiction', 'mystery', 'narrative'],
  chill: ['calm', 'ambient', 'meditation', 'soft spoken'],
  be_distracted: ['random', 'light', 'banter', 'entertaining'],
  be_shocked: ['true crime', 'scandal', 'unbelievable', 'twist'],
  reflect: ['introspective', 'life', 'meaning', 'mental health'],
  stay_updated: ['news', 'current events', 'culture', 'politics'],
  feel_seen: ['identity', 'relationships', 'personal stories'],
  kill_time: ['facts', 'trivia', 'low effort', 'background'],
};

export async function scoreEpisode(
  episode: Episode,
  userMoods: Mood[],
  userThemes: Theme[],
  maxDuration: number
): Promise<ScoredEpisode> {
  const text = `${episode.title} ${episode.description}`.toLowerCase();
  let score = 0;
  const matchReasons: string[] = [];

  // Score mood matches
  userMoods.forEach(mood => {
    const moodKeywords = vibeKeywordMap[mood] || [];
    const matchedKeywords = moodKeywords.filter(keyword => text.includes(keyword.toLowerCase()));
    if (matchedKeywords.length > 0) {
      score += matchedKeywords.length * 2;
      matchReasons.push(`Matches your ${mood} mood (${matchedKeywords.join(', ')})`);
    }
  });

  // Score intention matches
  userThemes.forEach(theme => {
    const themeKeywords = themeKeywordMap[theme] || [];
    const matchedKeywords = themeKeywords.filter(keyword => text.includes(keyword.toLowerCase()));
    if (matchedKeywords.length > 0) {
      score += matchedKeywords.length * 3;
      matchReasons.push(`Perfect to ${theme.replace('_', ' ')} (${matchedKeywords.join(', ')})`);
    }
  });

  // Duration scoring - bonus for episodes closer to the exact requested duration
  const durationMinutes = Math.floor(episode.audio_length_sec / 60);
  const durationDifference = Math.abs(durationMinutes - maxDuration);
  
  if (durationDifference === 0) {
    // Perfect match
    score += 10;
    matchReasons.push(`Perfect length at ${durationMinutes} minutes`);
  } else if (durationDifference <= 2) {
    // Very close match
    score += 7;
    matchReasons.push(`Great length at ${durationMinutes} minutes`);
  } else if (durationDifference <= 5) {
    // Good match (within our filter range)
    score += 5;
    matchReasons.push(`Good length at ${durationMinutes} minutes`);
  } else {
    // This shouldn't happen with our new filtering, but just in case
    score -= 5;
    matchReasons.push(`${durationMinutes} minutes (outside preferred range)`);
  }

  // Bonus for recent episodes
  if (episode.published_at) {
    const publishedDate = new Date(episode.published_at);
    const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublished < 30) {
      score += 2;
      matchReasons.push('Recently published');
    }
  }

  // Rating-based bonus - this uses previous user ratings to improve recommendations
  try {
    const ratingBonus = await ratingService.getEpisodeRatingBonus(episode.id, userMoods, userThemes);
    if (ratingBonus > 0) {
      score += ratingBonus;
      matchReasons.push('Highly rated by users with similar preferences');
    }
  } catch (error) {
    console.error('Error getting rating bonus:', error);
    // Continue without rating bonus
  }

  const matchReason = matchReasons.length > 0 
    ? matchReasons.join(' • ') 
    : 'General match based on your preferences';

  return {
    ...episode,
    score,
    matchReason,
  };
}

export async function rankEpisodes(
  episodes: Episode[],
  userMoods: Mood[],
  userThemes: Theme[],
  maxDuration: number
): Promise<ScoredEpisode[]> {
  // First, filter episodes to only include those within 5 minutes of the selected duration
  const durationToleranceMinutes = 5;
  const minDurationSeconds = Math.max(0, (maxDuration - durationToleranceMinutes) * 60);
  const maxDurationSeconds = (maxDuration + durationToleranceMinutes) * 60;
  
  console.log(`Filtering episodes for duration: ${maxDuration} minutes (${minDurationSeconds/60}-${maxDurationSeconds/60} min range)`);
  
  const filteredEpisodes = episodes.filter(episode => {
    const durationInRange = episode.audio_length_sec >= minDurationSeconds && 
                           episode.audio_length_sec <= maxDurationSeconds;
    
    if (!durationInRange) {
      console.log(`Filtered out episode "${episode.title}" - ${Math.floor(episode.audio_length_sec/60)} minutes (outside ${maxDuration}±${durationToleranceMinutes} min range)`);
    }
    
    return durationInRange;
  });
  
  console.log(`Filtered ${episodes.length} episodes down to ${filteredEpisodes.length} episodes within duration range`);
  
  // If no episodes match the duration filter, fall back to a wider range
  if (filteredEpisodes.length === 0) {
    console.log('No episodes found in strict duration range, expanding to ±15 minutes');
    const expandedMinDuration = Math.max(0, (maxDuration - 15) * 60);
    const expandedMaxDuration = (maxDuration + 15) * 60;
    
    const expandedFiltered = episodes.filter(episode => 
      episode.audio_length_sec >= expandedMinDuration && 
      episode.audio_length_sec <= expandedMaxDuration
    );
    
    console.log(`Found ${expandedFiltered.length} episodes with expanded duration range`);
    
    // Score all episodes in parallel
    const scoredEpisodes = await Promise.all(
      expandedFiltered.map(episode => scoreEpisode(episode, userMoods, userThemes, maxDuration))
    );
    
    return scoredEpisodes.sort((a, b) => b.score - a.score);
  }
  
  // Score all episodes in parallel
  const scoredEpisodes = await Promise.all(
    filteredEpisodes.map(episode => scoreEpisode(episode, userMoods, userThemes, maxDuration))
  );
  
  return scoredEpisodes.sort((a, b) => b.score - a.score);
} 