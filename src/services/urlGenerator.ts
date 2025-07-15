import { Episode } from '../types';

export class UrlGeneratorService {
  // Generate Spotify search URL for a podcast/episode
  public generateSpotifyUrl(episode: Episode): string {
    const baseUrl = 'https://open.spotify.com/search';
    const searchQuery = `${episode.podcast_name} ${episode.title}`;
    const encodedQuery = encodeURIComponent(searchQuery);
    return `${baseUrl}/${encodedQuery}`;
  }

  // Generate Apple Podcasts search URL for a podcast/episode
  public generateApplePodcastsUrl(episode: Episode): string {
    const baseUrl = 'https://podcasts.apple.com/search';
    const searchQuery = `${episode.podcast_name} ${episode.title}`;
    const params = new URLSearchParams({
      term: searchQuery,
    });
    return `${baseUrl}?${params.toString()}`;
  }

  // Generate a generic podcast search URL (can be used for other platforms)
  public generateGenericSearchUrl(episode: Episode, platform: string = 'google'): string {
    const searchQuery = `${episode.podcast_name} ${episode.title} podcast`;
    const encodedQuery = encodeURIComponent(searchQuery);
    
    switch (platform) {
      case 'google':
        return `https://www.google.com/search?q=${encodedQuery}`;
      case 'bing':
        return `https://www.bing.com/search?q=${encodedQuery}`;
      default:
        return `https://www.google.com/search?q=${encodedQuery}`;
    }
  }

  // Enhance episodes with platform URLs
  public enhanceEpisodesWithUrls(episodes: Episode[]): Episode[] {
    return episodes.map(episode => ({
      ...episode,
      // Only add URLs if they don't already exist
      spotify_url: episode.spotify_uri ? episode.external_url : this.generateSpotifyUrl(episode),
      apple_podcasts_url: episode.apple_podcasts_url || this.generateApplePodcastsUrl(episode),
    }));
  }
}

export const urlGeneratorService = new UrlGeneratorService(); 