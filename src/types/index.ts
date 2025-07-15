export interface Episode {
  id: string;
  title: string;
  description: string;
  audio_length_sec: number;
  podcast_name: string;
  cover_art?: string;
  spotify_uri?: string;
  spotify_url?: string; // Add Spotify search URL
  external_url?: string;
  apple_podcasts_url?: string; // Add Apple Podcasts URL
  published_at?: string;
}

export interface SpotifyEpisode {
  id: string;
  name?: string;
  description?: string;
  html_description?: string;
  duration_ms?: number;
  publisher?: string;
  show_name?: string;
  podcast_name?: string;
  cover_art?: string;
  show?: {
    id?: string;
    name?: string;
    title?: string;
    publisher?: string;
    display_name?: string;
    description?: string;
    image?: string;
    images?: Array<{ url: string; height: number; width: number }>;
    owner?: {
      name?: string;
      display_name?: string;
    };
    external_urls?: {
      spotify?: string;
    };
  };
  podcast?: {
    name?: string;
    title?: string;
    image?: string;
  };
  images?: Array<{ url: string; height: number; width: number }>;
  uri?: string;
  external_urls?: {
    spotify?: string;
  };
  release_date?: string;
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

export interface UserRating {
  episodeId: string;
  rating: number; // 1-5 stars
  mood: Mood[];
  themes: Theme[];
  timestamp: number;
  comment?: string;
}

export interface RatingData {
  episodeId: string;
  averageRating: number;
  totalRatings: number;
  moodRatings: Record<Mood, { sum: number; count: number }>;
  themeRatings: Record<Theme, { sum: number; count: number }>;
} 