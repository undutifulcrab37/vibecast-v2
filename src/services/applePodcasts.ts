import { Episode } from '../types';

export class ApplePodcastsService {
  private readonly ITUNES_SEARCH_BASE_URL = 'https://itunes.apple.com/search';

  // Search for podcasts using iTunes Search API
  public async searchPodcasts(query: string, limit: number = 10): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        term: query,
        media: 'podcast',
        entity: 'podcast',
        limit: limit.toString(),
        country: 'US',
      });

      const response = await fetch(`${this.ITUNES_SEARCH_BASE_URL}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`iTunes Search API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching Apple Podcasts:', error);
      return [];
    }
  }

  // Generate Apple Podcasts URL for a podcast
  public generateApplePodcastsUrl(podcastName: string, episodeTitle?: string): string {
    const baseUrl = 'https://podcasts.apple.com/search';
    const searchQuery = episodeTitle 
      ? `${podcastName} ${episodeTitle}` 
      : podcastName;
    
    const params = new URLSearchParams({
      term: searchQuery,
    });

    return `${baseUrl}?${params.toString()}`;
  }

  // Enhanced method to find Apple Podcasts URL for a specific episode
  public async findApplePodcastsUrl(episode: Episode): Promise<string> {
    try {
      // First, search for the podcast
      const podcasts = await this.searchPodcasts(episode.podcast_name, 5);
      
      if (podcasts.length > 0) {
        // Find the best match
        const bestMatch = podcasts.find(podcast => 
          podcast.collectionName?.toLowerCase().includes(episode.podcast_name.toLowerCase()) ||
          podcast.artistName?.toLowerCase().includes(episode.podcast_name.toLowerCase())
        ) || podcasts[0];

        if (bestMatch && bestMatch.collectionViewUrl) {
          return bestMatch.collectionViewUrl;
        }
      }

      // Fallback to search URL
      return this.generateApplePodcastsUrl(episode.podcast_name, episode.title);
    } catch (error) {
      console.error('Error finding Apple Podcasts URL:', error);
      return this.generateApplePodcastsUrl(episode.podcast_name, episode.title);
    }
  }

  // Method to enhance episodes with Apple Podcasts URLs
  public async enhanceEpisodesWithAppleLinks(episodes: Episode[]): Promise<Episode[]> {
    const enhanced = await Promise.all(
      episodes.map(async (episode) => {
        if (!episode.apple_podcasts_url) {
          const appleUrl = await this.findApplePodcastsUrl(episode);
          return {
            ...episode,
            apple_podcasts_url: appleUrl,
          };
        }
        return episode;
      })
    );

    return enhanced;
  }
}

export const applePodcastsService = new ApplePodcastsService(); 