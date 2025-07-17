export interface Episode {
  id: string;
  title: string;
  description: string;
  audio_length_sec: number;
  podcast_name: string;
  publisher?: string;
  cover_art?: string;
  external_url?: string;
  spotify_uri?: string;
  published_at?: string;
  // New fields for multi-platform support
  platform_links?: {
    spotify?: string;
    apple?: string;
    google?: string;
    web?: string;
  };
  content_type?: 'episode' | 'podcast_show';
  // New flag to track top charts/new & noteworthy content
  is_top_quality?: boolean;
  // VibeCast 2.1: New fields for popularity scoring
  spotify_popularity?: number;  // Spotify popularity score (0-100)
  follower_count?: number;      // Number of followers/subscribers
  chart_position?: number;      // Chart position (1-100, lower is better)
  // Enhanced quality indicators
  has_transcript?: boolean;     // Whether transcript is available
  episode_count?: number;       // Total episodes in the podcast
  release_schedule?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'irregular';
  // Apple Podcasts URL
  apple_podcasts_url?: string;
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