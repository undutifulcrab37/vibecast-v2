import { Episode } from '../types';
import { spotifyService, SpotifyPodcast } from './spotify';

export type PodcastProvider = 'spotify';

export interface PodcastSearchResult {
  episodes: Episode[];
  provider: PodcastProvider;
  error?: string;
}

export class PodcastService {
  private currentProvider: PodcastProvider = 'spotify';
  // private searchCache = new Map<string, { data: Episode[]; timestamp: number }>();
  // private readonly CACHE_TTL =50;

  constructor() {
    console.log('🎧 PodcastService initialized');
  }

  // Convert SpotifyPodcast to Episode format
  private convertSpotifyPodcastToEpisode(podcast: SpotifyPodcast): Episode {
    // Set a reasonable default duration for podcast shows (30 minutes = 1800 seconds)
    // This allows them to pass through the scoring system's duration filters
    const defaultDurationSeconds = 30 * 60; // 30 minutes
    
    return {
      id: `spotify_${podcast.id}`,
      title: podcast.name,
      description: podcast.description || 'No description available',
      audio_length_sec: defaultDurationSeconds, // Default duration for podcast shows
      podcast_name: podcast.name,
      publisher: podcast.publisher,
      cover_art: podcast.images?.[0]?.url || '',
      external_url: podcast.external_urls.spotify,
      spotify_uri: `spotify:show:${podcast.id}`,
      published_at: new Date().toISOString(),
      // Add platform links
      platform_links: {
        spotify: podcast.external_urls.spotify,
        apple: podcast.apple_url,
        google: podcast.google_url,
        web: podcast.web_url,
      },
      // Mark as podcast show rather than episode
      content_type: 'podcast_show',
      // Mark all Spotify content as top quality since it's curated
      is_top_quality: true,
      // VibeCast 2.1: Map popularity and quality indicators
      spotify_popularity: podcast.popularity || 0,
      episode_count: podcast.total_episodes || 0,
      // Estimate follower count based on popularity (rough approximation)
      follower_count: podcast.popularity ? Math.floor(podcast.popularity * 1000) : undefined,
      // Professional podcasts typically have good descriptions
      has_transcript: (podcast.description?.length || 0) > 100,
      // Assume regular release schedule for popular podcasts
      release_schedule: podcast.popularity && podcast.popularity > 50 ? 'weekly' : 'irregular',
    };
  }

  // Search using Spotify service (returns podcast shows with platform links)
  private async searchSpotify(query: string, limit: number = 20): Promise<Episode[]> {
    try {
      console.log('🎵 Searching Spotify for:', query);
      const podcasts = await spotifyService.searchPodcasts(query, limit);
      const episodes = podcasts.map(podcast => this.convertSpotifyPodcastToEpisode(podcast));
      console.log(`✅ Spotify: Found ${episodes.length} podcast shows`);
      return episodes;
    } catch (error) {
      console.error('❌ Spotify search failed:', error);
      throw error;
    }
  }

  // Remove duplicate episodes based on title similarity
  private removeDuplicates(episodes: Episode[]): Episode[] {
    const seen = new Set<string>();
    const unique: Episode[] = [];

    for (const episode of episodes) {
      // Create a normalized key for comparison
      const key = this.normalizeTitle(episode.title);
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(episode);
      }
    }

    return unique;
  }

  // Normalize title for duplicate detection
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Main search method using only Spotify
  async searchPodcasts(query: string, limit: number = 20): Promise<PodcastSearchResult> {
    console.log(`🔍 Starting Spotify podcast search: "${query}" (limit: ${limit})`);
    
    try {
      const spotifyResults = await this.searchSpotify(query, limit);
      const uniqueResults = this.removeDuplicates(spotifyResults);
      
      return {
        episodes: uniqueResults.slice(0, limit),
        provider: 'spotify',
      };
    } catch (error) {
      console.error('💥 Spotify podcast search failed:', error);
      return {
        episodes: [],
        provider: 'spotify',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Set preferred provider (always Spotify now)
  setProvider(_provider: PodcastProvider): void {
    this.currentProvider = 'spotify';
    console.log(`📡 Provider set to: spotify`);
  }

  // Get current provider
  getProvider(): PodcastProvider {
    return this.currentProvider;
  }

  // Get provider status for UI
  getProviderStatus(): {
    provider: PodcastProvider;
    authenticated: boolean;
  } {
    return {
      provider: this.currentProvider,
      authenticated: false, // Mock spotify service doesn't require authentication
    };
  }

  // Get provider recommendation
  getProviderRecommendation(): {
    recommended: PodcastProvider;
    reason: string;
  } {
    return {
      recommended: 'spotify',
      reason: 'Spotify provides access to millions of high-quality podcasts.',
    };
  }

  // Test Spotify service only
  async testServices(): Promise<{
    spotify: { success: boolean; message: string };
  }> {
    const spotifyResult = await spotifyService.testService().catch(() => ({
      success: false,
      message: 'Service test failed'
    }));

    return {
      spotify: spotifyResult,
    };
  }
}

export const podcastService = new PodcastService(); 