import { SpotifyEpisode, Episode } from '../types';
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
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    
    if (token) {
      localStorage.setItem('spotify_access_token', token);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    return token;
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

  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  public logout(): void {
    this.accessToken = null;
    localStorage.removeItem('spotify_access_token');
  }

  private async makeRequest(endpoint: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('Spotify authentication expired');
        this.logout();
        throw new Error('Authentication expired');
      }
      const errorText = await response.text();
      console.error(`Spotify API error: ${response.status} - ${errorText}`);
      throw new Error(`Spotify API error: ${response.status}`);
    }

    return response.json();
  }

  public async searchEpisodes(query: string, limit: number = 20): Promise<Episode[]> {
    try {
      console.log('Searching Spotify episodes with query:', query);
      const params = new URLSearchParams({
        q: query,
        type: 'episode',
        limit: limit.toString(),
        market: 'US',
      });

      const data = await this.makeRequest(`/search?${params.toString()}`);
      console.log('Spotify search results:', data);
      
      return data.episodes.items.map((episode: SpotifyEpisode) => this.convertSpotifyEpisode(episode));
    } catch (error) {
      console.error('Error searching Spotify episodes:', error);
      return [];
    }
  }

  public async getShowEpisodes(showId: string, limit: number = 20): Promise<Episode[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        market: 'US',
      });

      const data = await this.makeRequest(`/shows/${showId}/episodes?${params.toString()}`);
      
      return data.items.map((episode: SpotifyEpisode) => this.convertSpotifyEpisode(episode));
    } catch (error) {
      console.error('Error fetching show episodes:', error);
      return [];
    }
  }

  private convertSpotifyEpisode(episode: SpotifyEpisode): Episode {
    return {
      id: episode.id,
      title: episode.name,
      description: episode.description,
      audio_length_sec: Math.floor(episode.duration_ms / 1000),
      podcast_name: episode.show.name,
      cover_art: episode.show.images[0]?.url,
      spotify_uri: episode.uri,
      external_url: episode.external_urls.spotify,
      published_at: episode.release_date,
    };
  }

  public async playEpisode(uri: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      console.log('Attempting to play episode:', uri);
      
      // First check if user has an active device
      const devicesResponse = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (devicesResponse.ok) {
        const devices = await devicesResponse.json();
        console.log('Available devices:', devices);
        
        if (devices.devices.length === 0) {
          throw new Error('No active Spotify device found. Please open Spotify on your device first.');
        }
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
    } catch (error) {
      console.error('Error playing episode:', error);
      throw error;
    }
  }
}

export const spotifyService = new SpotifyService(); 