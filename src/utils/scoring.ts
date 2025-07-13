import { Episode, Mood, Theme, ScoredEpisode } from '../types';

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

export function scoreEpisode(
  episode: Episode,
  userMoods: Mood[],
  userThemes: Theme[],
  maxDuration: number
): ScoredEpisode {
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

  // Duration scoring - bonus if episode length fits within user time, penalize if too long
  const durationMinutes = Math.floor(episode.audio_length_sec / 60);
  if (episode.audio_length_sec <= maxDuration * 60) {
    score += 5;
    matchReasons.push(`Perfect length at ${durationMinutes} minutes`);
  } else {
    score -= 10;
    matchReasons.push(`A bit longer than requested at ${durationMinutes} minutes`);
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

  const matchReason = matchReasons.length > 0 
    ? matchReasons.join(' • ') 
    : 'General match based on your preferences';

  return {
    ...episode,
    score,
    matchReason,
  };
}

export function rankEpisodes(
  episodes: Episode[],
  userMoods: Mood[],
  userThemes: Theme[],
  maxDuration: number
): ScoredEpisode[] {
  return episodes
    .map(episode => scoreEpisode(episode, userMoods, userThemes, maxDuration))
    .sort((a, b) => b.score - a.score);
} 