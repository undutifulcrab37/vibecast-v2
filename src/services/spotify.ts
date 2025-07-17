// Real Spotify Web API integration - NO MOCK DATA
// import { Episode } from '../types';

export interface SpotifyPodcast {
  id: string;
  name: string;
  description: string;
  publisher: string;
  images: Array<{ url: string; height: number; width: number }>;
  total_episodes: number;
  external_urls: {
    spotify: string;
  };
  // Multi-platform support
  apple_url: string;
  google_url: string;
  web_url: string;
  // VibeCast 2.1: Popularity and quality indicators
  popularity?: number;
  explicit?: boolean;
  languages?: string[];
  media_type?: string;
}

export interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  duration_ms: number;
  release_date: string;
  external_urls: {
    spotify: string;
  };
  show: {
    id: string;
    name: string;
    publisher: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
}

export class SpotifyService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  // private searchCache = new Map<string, { data: SpotifyPodcast[], timestamp: number }>();
  private readonly CLIENT_ID = process.env.VITE_SPOTIFY_CLIENT_ID || '';
  private readonly REDIRECT_URI = process.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:3001/callback';
  // private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  
  // Daily top podcasts cache
  private topPodcastsCache: SpotifyPodcast[] = [];
  private topPodcastsTimestamp: number = 0;
  private readonly TOP_PODCASTS_TTL = 24 * 60 * 60 * 1000; // 24 hours

  // Generate platform-specific URLs for podcast discovery
  private generatePlatformUrls(podcastName: string, publisher?: string) {
    const searchQuery = encodeURIComponent(podcastName);
    const fullQuery = publisher ? encodeURIComponent(`${podcastName} ${publisher}`) : searchQuery;
    
    return {
      spotify: `https://open.spotify.com/search/${searchQuery}/shows`,
      apple: `podcasts://podcasts.apple.com/search?term=${fullQuery}`,
      google: `https://podcasts.google.com/search/${searchQuery}`,
      web: `https://www.google.com/search?q=${fullQuery}+podcast`,
    };
  }

  // Get access token using backend endpoint (secure)
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // Use local server for development, Vercel for production
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/spotify-auth' 
        : 'http://localhost:3001/api/spotify-auth';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Auth endpoint failed: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
      
      if (!this.accessToken) {
        throw new Error('No access token received from Spotify auth endpoint');
      }
      
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Spotify access token:', error);
      throw error;
    }
  }

  // Get daily top podcasts for fallback
  private async getTopPodcasts(): Promise<SpotifyPodcast[]> {
    if (this.topPodcastsCache.length > 0 && Date.now() - this.topPodcastsTimestamp < this.TOP_PODCASTS_TTL) {
      return this.topPodcastsCache;
    }

    try {
      const token = await this.getAccessToken();
      const markets = ['US', 'AU', 'GB', 'CA', 'NZ', 'IE', 'ZA'];
      // let allTopShows: any[] = [];

      // Fetch featured playlists and extract podcast shows
      const playlistPromises = markets.map(async (market) => {
        const response = await fetch(`https://api.spotify.com/v1/browse/featured-playlists?market=${market}&limit=20`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          // Extract shows from playlists (this is a simplified approach)
          return data.playlists?.items || [];
        }
        return [];
      });

      const playlistResults = await Promise.all(playlistPromises);
      
      // Also fetch trending shows directly
      const trendingPromises = markets.map(async (market) => {
        const response = await fetch(`https://api.spotify.com/v1/search?q=podcast&type=show&market=${market}&limit=20`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.shows?.items || [];
        }
        return [];
      });

      const trendingResults = await Promise.all(trendingPromises);
      
      // Combine and deduplicate
      const allResults = [...playlistResults.flat(), ...trendingResults.flat()];
      const uniqueResults = allResults.filter((show, index, self) => 
        self.findIndex(s => s.id === show.id) === index
      );

      // Convert to SpotifyPodcast format
      this.topPodcastsCache = uniqueResults.map((show: any) => {
        const urls = this.generatePlatformUrls(show.name, show.publisher);
        return {
          id: show.id,
          name: show.name,
          description: show.description || '',
          publisher: show.publisher || '',
          images: show.images || [],
          total_episodes: show.total_episodes || 0,
          external_urls: show.external_urls || { spotify: '' },
          apple_url: urls.apple,
          google_url: urls.google,
          web_url: urls.web,
          popularity: show.popularity || 0,
          explicit: show.explicit || false,
          languages: show.languages || [],
          media_type: show.media_type || 'audio',
        };
      });

      this.topPodcastsTimestamp = Date.now();
      return this.topPodcastsCache;
    } catch (error) {
      console.error('Failed to fetch top podcasts:', error);
      return [];
    }
  }

  // Search for real episodes using TOP 50 CHARTS ONLY
  async searchPodcasts(query: string, limit: number = 20): Promise<SpotifyPodcast[]> {
    try {
      console.log(`🔍 Starting TOP 50 CHARTS episode search for "${query}"`);
      // const token = await this.getAccessToken();
      
      // Map mood-based queries to appropriate categories
      const moodMapping: Record<string, string> = {
        'happy': 'comedy',
        'want to laugh': 'comedy',
        'laugh': 'comedy',
        'funny': 'comedy',
        'humor': 'comedy',
        'entertainment': 'comedy',
        'sad': 'society-culture',
        'relaxed': 'leisure',
        'excited': 'music',
        'inspired': 'motivation'
      };
      
      // Determine the actual search category based on query
      let searchCategory = query.toLowerCase();
      if (moodMapping[searchCategory]) {
        searchCategory = moodMapping[searchCategory];
        console.log(`🎭 Mapped mood query "${query}" to category "${searchCategory}"`);
      }
      
      // Get top podcasts from charts
      const topPodcasts = await this.getTopPodcasts();
      
      // Filter top podcasts by category
      const categoryFiltered = topPodcasts.filter((podcast: any) => {
        const title = (podcast.name || '').toLowerCase();
        const description = (podcast.description || '').toLowerCase();
        const publisher = (podcast.publisher || '').toLowerCase();
        
        // For comedy searches, only allow comedy content
        if (searchCategory === 'comedy') {
          const comedyKeywords = [
            'comedy', 'funny', 'humor', 'joke', 'laugh', 'standup', 'stand-up',
            'comedian', 'satire', 'parody', 'sketch', 'improv', 'comedy club',
            'late night', 'talk show', 'entertainment', 'fun', 'hilarious',
            'rogan', 'conan', 'colbert', 'fallon', 'kimmel', 'myers',
            'comedy central', 'netflix comedy', 'amazon comedy'
          ];
          
          const hasComedyContent = comedyKeywords.some(keyword => 
            title.includes(keyword) || 
            description.includes(keyword) || 
            publisher.includes(keyword)
          );
          
          // BLOCK all non-comedy content for comedy searches
          if (!hasComedyContent) {
            console.log(`🚫 BLOCKED non-comedy content: "${podcast.name}"`);
            return false;
          }
          
          // Also block crime content for comedy searches
          const crimeKeywords = [
            'crime', 'murder', 'true crime', 'serial killer', 'investigation',
            'detective', 'police', 'forensic', 'criminal', 'justice'
          ];
          
          const hasCrimeContent = crimeKeywords.some(keyword => 
            title.includes(keyword) || 
            description.includes(keyword) || 
            publisher.includes(keyword)
          );
          
          if (hasCrimeContent) {
            console.log(`🚫 BLOCKED crime content for comedy: "${podcast.name}"`);
            return false;
          }
        }
        
        return true;
      });
      
      // Sort by popularity (highest first)
      const sortedResults = categoryFiltered.sort((a: any, b: any) => {
        const aPopularity = a.popularity || 0;
        const bPopularity = b.popularity || 0;
        return bPopularity - aPopularity;
      });
      
      // Take top results and get episodes for each
      const topShows = sortedResults.slice(0, Math.min(limit, 10)); // Get episodes for top 10 shows
      let allEpisodes: any[] = [];
      
      // Get episodes for each show
      for (const show of topShows) {
        try {
          const episodes = await this.getPodcastEpisodes(show.id, 5); // Get 5 episodes per show
          const showEpisodes = episodes.map((episode: any) => ({
            id: episode.id,
            name: episode.name,
            description: episode.description || episode.html_description || '',
            publisher: show.publisher || episode.show?.publisher || '',
            podcast_name: show.name,
            images: episode.images || show.images || [],
            total_episodes: show.total_episodes || 0,
            external_urls: episode.external_urls || show.external_urls || { spotify: '' },
            apple_url: show.apple_url || '',
            google_url: show.google_url || '',
            web_url: show.web_url || '',
            popularity: show.popularity || 0,
            explicit: episode.explicit || show.explicit || false,
            languages: show.languages || ['en'],
            media_type: 'audio',
            // Episode-specific fields
            spotify_uri: episode.uri || `spotify:episode:${episode.id}`,
            external_url: episode.external_urls?.spotify || show.external_urls?.spotify || '',
            duration_ms: episode.duration_ms || 0,
            release_date: episode.release_date || '',
            // Show info for context
            show_id: show.id,
            show_name: show.name,
            show_publisher: show.publisher,
            show_images: show.images || []
          }));
          
          allEpisodes = [...allEpisodes, ...showEpisodes];
        } catch (error) {
          console.log(`⚠️ Failed to get episodes for ${show.name}:`, error);
        }
      }
      
      // Sort episodes by popularity and take top results
      const sortedEpisodes = allEpisodes.sort((a: any, b: any) => {
        const aPopularity = a.popularity || 0;
        const bPopularity = b.popularity || 0;
        return bPopularity - aPopularity;
      });
      
      const finalResults = sortedEpisodes.slice(0, limit);
      
      console.log(`🎵 TOP 50 CHARTS: Found ${finalResults.length} episodes for "${query}" (category: ${searchCategory})`);
      
      return finalResults.map((episode: any) => {
        const urls = this.generatePlatformUrls(episode.podcast_name || episode.name, episode.publisher);
        
        return {
          id: episode.id,
          name: episode.name,
          description: episode.description || '',
          publisher: episode.publisher || '',
          images: episode.images || episode.show_images || [],
          total_episodes: episode.total_episodes || 0,
          external_urls: episode.external_urls || { spotify: '' },
          apple_url: episode.apple_url || urls.apple,
          google_url: episode.google_url || urls.google,
          web_url: episode.web_url || urls.web,
          popularity: episode.popularity || 0,
          explicit: episode.explicit || false,
          languages: episode.languages || ['en'],
          media_type: episode.media_type || 'audio',
          // Episode-specific fields
          spotify_uri: episode.spotify_uri,
          external_url: episode.external_url,
          duration_ms: episode.duration_ms || 0,
          release_date: episode.release_date || '',
          // Show info
          show_id: episode.show_id,
          show_name: episode.show_name || episode.podcast_name,
          show_publisher: episode.show_publisher || episode.publisher,
          show_images: episode.show_images || episode.images,
        };
      });
    } catch (error) {
      console.error('Spotify episode search failed:', error);
      throw error;
    }
  }

  // Get real podcast details
  async getPodcastDetails(spotifyId: string): Promise<SpotifyPodcast | null> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(`https://api.spotify.com/v1/shows/${spotifyId}?market=US`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get podcast details: ${response.status}`);
      }

      const show = await response.json();
      const urls = this.generatePlatformUrls(show.name, show.publisher);
      
      return {
        id: show.id,
        name: show.name,
        description: show.description || '',
        publisher: show.publisher || '',
        images: show.images || [],
        total_episodes: show.total_episodes || 0,
        external_urls: show.external_urls || { spotify: '' },
        apple_url: urls.apple,
        google_url: urls.google,
        web_url: urls.web,
      };
    } catch (error) {
      console.error('Failed to get podcast details:', error);
      return null;
    }
  }

  // Get real episodes for a podcast
  async getPodcastEpisodes(spotifyId: string, limit: number = 20): Promise<SpotifyEpisode[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(`https://api.spotify.com/v1/shows/${spotifyId}/episodes?market=US&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get episodes: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Failed to get podcast episodes:', error);
      return [];
    }
  }

  // User authentication methods (for premium features)
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getLoginUrl(): string {
    const scopes = [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
    ];
    
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      response_type: 'code',
      redirect_uri: this.REDIRECT_URI,
      scope: scopes.join(' '),
      state: Math.random().toString(36).substring(7),
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async playEpisode(spotifyUri: string): Promise<void> {
    try {
      // First try to use the Spotify Web API for playback
      if (this.accessToken) {
        const response = await fetch('https://api.spotify.com/v1/me/player/play', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: [spotifyUri],
          }),
        });

        if (response.ok) {
          console.log('✅ Successfully started playback via Spotify API');
          return;
        }
        
        // If we get a 403, it means the user doesn't have playback permissions
        if (response.status === 403) {
          console.log('⚠️ User doesn\'t have playback permissions, opening Spotify web player');
          throw new Error('Playback failed: 403 - User authentication required');
        }
        
        throw new Error(`Playback failed: ${response.status}`);
      } else {
        throw new Error('Not authenticated with Spotify');
      }
    } catch (error) {
      console.error('Failed to play episode via API:', error);
      
      // Fallback: Convert Spotify URI to web URL and open
      let spotifyUrl = '';
      
      if (spotifyUri.startsWith('spotify:episode:')) {
        // Convert episode URI to web URL
        const episodeId = spotifyUri.replace('spotify:episode:', '');
        spotifyUrl = `https://open.spotify.com/episode/${episodeId}`;
      } else if (spotifyUri.startsWith('spotify:show:')) {
        // Convert show URI to web URL
        const showId = spotifyUri.replace('spotify:show:', '');
        spotifyUrl = `https://open.spotify.com/show/${showId}`;
      } else if (spotifyUri.startsWith('https://open.spotify.com/')) {
        // Already a web URL
        spotifyUrl = spotifyUri;
      } else {
        // Fallback: search for the podcast
        const searchQuery = encodeURIComponent(spotifyUri);
        spotifyUrl = `https://open.spotify.com/search/${searchQuery}/shows`;
      }
      
      console.log(`🎵 Opening Spotify web player: ${spotifyUrl}`);
      window.open(spotifyUrl, '_blank');
      
      throw error;
    }
  }

  // Test the real service
  async testService(): Promise<{ success: boolean; message: string }> {
    try {
      await this.getAccessToken();
      const results = await this.searchPodcasts('comedy', 5);
      return {
        success: true,
        message: `Successfully connected to Spotify API. Found ${results.length} real podcasts.`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Spotify API Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Debug method to test search algorithm
  async debugSearch(query: string): Promise<void> {
    console.log(`🔍 DEBUG: Testing search for "${query}"`);
    try {
      const results = await this.searchPodcasts(query, 5);
      console.log(`✅ Found ${results.length} results for "${query}":`);
      results.forEach((podcast, index) => {
        console.log(`${index + 1}. ${podcast.name} - ${podcast.publisher}`);
      });
    } catch (error) {
      console.error(`❌ Search failed for "${query}":`, error);
    }
  }
}

export const spotifyService = new SpotifyService();