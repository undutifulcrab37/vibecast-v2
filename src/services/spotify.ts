import { Episode } from '../types';
import { config } from '../config';

const SPOTIFY_CLIENT_ID = config.spotify.clientId;
const SPOTIFY_REDIRECT_URI = config.spotify.redirectUri;
const SPOTIFY_SCOPES = config.spotify.scopes;

export class SpotifyService {
  private accessToken: string | null = null;

  constructor() {
    // Check for access token in URL hash or localStorage
    this.accessToken = this.getAccessTokenFromUrl() || localStorage.getItem('spotify_access_token');
  }

  private getAccessTokenFromUrl(): string | null {
    const hash = window.location.hash.substr(1);
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    
    if (token) {
      // Save to localStorage and clear URL
      localStorage.setItem('spotify_access_token', token);
      window.location.hash = '';
      return token;
    }
    
    return null;
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  public getLoginUrl(): string {
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'token',
      redirect_uri: SPOTIFY_REDIRECT_URI,
      scope: SPOTIFY_SCOPES,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  public logout(): void {
    this.accessToken = null;
    localStorage.removeItem('spotify_access_token');
  }

  private async makeRequest(endpoint: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Spotify');
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('🔑 Spotify authentication expired');
          this.logout();
          throw new Error('Spotify authentication expired. Please log in again.');
        }
        
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          console.error(`🚫 Spotify rate limited. Retry after: ${retryAfter} seconds`);
          throw new Error(`Spotify API rate limited. Please try again in ${retryAfter || 'a few'} seconds.`);
        }
        
        const errorText = await response.text();
        console.error(`❌ Spotify API error: ${response.status} - ${errorText}`);
        throw new Error(`Spotify API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error - unable to reach Spotify API');
      }
      throw error;
    }
  }

  // Enhanced search for episodes with multiple strategies
  public async searchEpisodes(query: string, limit: number = 50): Promise<Episode[]> {
    try {
      console.log('🎵 Starting Spotify episode search:', query);
      
      const params = new URLSearchParams({
        q: query,
        type: 'episode',
        limit: Math.min(limit, 50).toString(), // Spotify max is 50
        market: 'US',
      });

      const data = await this.makeRequest(`/search?${params.toString()}`);
      
      console.log('🔍 Spotify search response:', {
        hasEpisodes: !!data.episodes,
        episodeCount: data.episodes?.items?.length || 0,
        total: data.episodes?.total || 0
      });
      
      if (!data || !data.episodes || !Array.isArray(data.episodes.items)) {
        console.warn('⚠️ Unexpected Spotify API response structure:', data);
        return [];
      }

      const episodes: Episode[] = [];
      
      // Process episodes in batches to avoid too many API calls
      for (const rawEpisode of data.episodes.items) {
        if (!rawEpisode || !rawEpisode.id) continue;
        
        try {
          const convertedEpisode = this.convertSpotifyEpisode(rawEpisode);
          episodes.push(convertedEpisode);
        } catch (error) {
          console.warn('⚠️ Failed to convert Spotify episode:', error);
        }
      }

      console.log(`✅ Spotify search successful: ${episodes.length} episodes converted`);
      return episodes;
    } catch (error) {
      console.error('💥 Spotify searchEpisodes failed:', error);
      throw error;
    }
  }

  // Search for shows (podcasts) and get recent episodes
  public async searchShows(query: string, limit: number = 20): Promise<Episode[]> {
    try {
      console.log('🎵 Starting Spotify show search:', query);
      
      const params = new URLSearchParams({
        q: query,
        type: 'show',
        limit: Math.min(limit, 50).toString(),
        market: 'US',
      });

      const data = await this.makeRequest(`/search?${params.toString()}`);
      
      if (!data || !data.shows || !Array.isArray(data.shows.items)) {
        console.warn('⚠️ No shows found in Spotify response');
        return [];
      }

      const episodes: Episode[] = [];
      
      // Get episodes from the first few shows
      for (const show of data.shows.items.slice(0, 5)) { // Limit to 5 shows to avoid too many API calls
        try {
          const showEpisodes = await this.getShowEpisodes(show.id, Math.ceil(limit / 5));
          episodes.push(...showEpisodes);
        } catch (error) {
          console.warn(`⚠️ Failed to get episodes for show ${show.id}:`, error);
        }
      }

      console.log(`✅ Spotify show search successful: ${episodes.length} episodes from shows`);
      return episodes.slice(0, limit);
    } catch (error) {
      console.error('💥 Spotify searchShows failed:', error);
      throw error;
    }
  }

  // Get episodes from a specific show
  public async getShowEpisodes(showId: string, limit: number = 20): Promise<Episode[]> {
    try {
      const params = new URLSearchParams({
        limit: Math.min(limit, 50).toString(),
        market: 'US',
      });

      const data = await this.makeRequest(`/shows/${showId}/episodes?${params.toString()}`);
      
      if (!data || !Array.isArray(data.items)) {
        return [];
      }

      // Get show details for context
      const showData = await this.makeRequest(`/shows/${showId}?market=US`);
      
      const episodes = data.items.map(episode => this.convertSpotifyEpisode(episode, showData));
      return episodes.filter(Boolean); // Remove any null conversions
    } catch (error) {
      console.error(`Error fetching episodes for show ${showId}:`, error);
      return [];
    }
  }

  // Combined search strategy: episodes + shows
  public async searchPodcasts(query: string, limit: number = 50): Promise<Episode[]> {
    try {
      console.log('🔍 Starting combined Spotify podcast search:', query);
      
      // Run both searches in parallel for better performance
      const [episodeResults, showResults] = await Promise.allSettled([
        this.searchEpisodes(query, Math.ceil(limit * 0.7)), // 70% from episode search
        this.searchShows(query, Math.ceil(limit * 0.3))     // 30% from show search
      ]);

      const episodes: Episode[] = [];
      
      // Add episode search results
      if (episodeResults.status === 'fulfilled') {
        episodes.push(...episodeResults.value);
      } else {
        console.warn('Episode search failed:', episodeResults.reason);
      }
      
      // Add show search results
      if (showResults.status === 'fulfilled') {
        episodes.push(...showResults.value);
      } else {
        console.warn('Show search failed:', showResults.reason);
      }

      // Remove duplicates based on episode ID
      const uniqueEpisodes = episodes.filter((episode, index, self) => 
        self.findIndex(e => e.id === episode.id) === index
      );

      console.log(`🎵 Combined Spotify search: ${uniqueEpisodes.length} unique episodes`);
      return uniqueEpisodes.slice(0, limit);
    } catch (error) {
      console.error('💥 Combined Spotify search failed:', error);
      throw error;
    }
  }

  // Test API connection
  public async testApiConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          message: 'Not authenticated with Spotify. Please log in first.'
        };
      }

      // Test with a simple search
      const data = await this.makeRequest('/search?q=podcast&type=episode&limit=5&market=US');
      
      if (data && data.episodes && data.episodes.items && data.episodes.items.length > 0) {
        return {
          success: true,
          message: 'Spotify API is working correctly',
          details: {
            resultCount: data.episodes.items.length,
            totalAvailable: data.episodes.total,
            sampleEpisode: data.episodes.items[0]?.name || 'No name'
          }
        };
      } else {
        return {
          success: false,
          message: 'Spotify API returned empty or invalid results',
          details: data
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Spotify API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
    }
  }

  private cleanDescription(description: string): string {
    if (!description) return 'No description available';
    
    // Remove HTML tags
    let cleaned = description.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    cleaned = cleaned
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
    
    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned || 'No description available';
  }

  private convertSpotifyEpisode(episode: any, showData?: any): Episode {
    try {
      // Use provided show data or episode's show property
      const show = showData || episode.show;
      
      const title = episode.name || 'Untitled Episode';
      const description = this.cleanDescription(episode.description || episode.html_description);
      const podcastName = show?.name || 'Unknown Podcast';
      const coverArt = episode.images?.[0]?.url || show?.images?.[0]?.url;
      const audioLength = Math.floor((episode.duration_ms || 0) / 1000);
      const externalUrl = episode.external_urls?.spotify;
      const spotifyUri = episode.uri;
      const pubDate = episode.release_date ? new Date(episode.release_date).toISOString() : new Date().toISOString();

      return {
        id: episode.id,
        title,
        description,
        audio_length_sec: audioLength,
        podcast_name: podcastName,
        cover_art: coverArt,
        external_url: externalUrl,
        spotify_uri: spotifyUri,
        published_at: pubDate,
      };
    } catch (error) {
      console.error('Error converting Spotify episode:', error, episode);
      throw error;
    }
  }

  public async playEpisode(uri: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Spotify');
    }

    try {
      // Check for available devices
      const devicesResponse = await this.makeRequest('/me/player/devices');
      
      if (!devicesResponse.devices || devicesResponse.devices.length === 0) {
        throw new Error('No active Spotify device found. Please open Spotify on your device first.');
      }

      const response = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [uri],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Play episode error:', response.status, errorText);
        throw new Error(`Failed to play episode: ${response.status}`);
      }

      console.log('✅ Episode started playing on Spotify');
    } catch (error) {
      console.error('Error playing episode:', error);
      throw error;
    }
  }
}

export const spotifyService = new SpotifyService(); 