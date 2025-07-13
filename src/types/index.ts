export interface Episode {
  id: string;
  title: string;
  description: string;
  audio_length_sec: number;
  podcast_name: string;
  cover_art?: string;
  spotify_uri?: string;
  external_url?: string;
  published_at?: string;
}

export interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  duration_ms: number;
  show: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  uri: string;
  external_urls: {
    spotify: string;
  };
  release_date: string;
}

export interface ListenNotesEpisode {
  id: string;
  title: string;
  description: string;
  audio_length_sec: number;
  podcast: {
    title: string;
    image: string;
  };
  listennotes_url: string;
  pub_date_ms: number;
}

export type Mood = 'happy' | 'sad' | 'anxious' | 'bored' | 'curious' | 'tired' | 'focused' | 'stressed' | 'surprise_me' | 'dont_know';
export type Theme = 'laugh' | 'cry' | 'learn' | 'be_inspired' | 'escape' | 'chill' | 'be_distracted' | 'be_shocked' | 'reflect' | 'stay_updated' | 'feel_seen' | 'kill_time';

export interface VibeSelection {
  moods: Mood[];
  themes: Theme[];
  maxDuration: number;
}

export interface ScoredEpisode extends Episode {
  score: number;
  matchReason: string;
} 