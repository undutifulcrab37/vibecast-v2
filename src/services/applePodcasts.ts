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

  // Generate Apple Podcasts app URL for a podcast (uses podcasts:// scheme)
  public generateApplePodcastsUrl(podcastName: string, episodeTitle?: string): string {
    // Clean up the podcast name and episode title for better search
    const cleanPodcastName = podcastName.replace(/[^\w\s]/g, '').trim();
    const cleanEpisodeTitle = episodeTitle ? episodeTitle.replace(/[^\w\s]/g, '').trim() : '';
    
    let searchQuery;
    if (cleanEpisodeTitle) {
      // Include both podcast name and episode title for more specific search
      searchQuery = `${cleanPodcastName} ${cleanEpisodeTitle}`;
    } else {
      searchQuery = cleanPodcastName;
    }
    
    // Use the podcasts:// URL scheme to launch the Apple Podcasts app directly
    const encodedQuery = encodeURIComponent(searchQuery);
    return `podcasts://podcasts.apple.com/search?term=${encodedQuery}`;
  }

  // Generate web fallback URL for Apple Podcasts
  public generateApplePodcastsWebUrl(podcastName: string, episodeTitle?: string): string {
    const cleanPodcastName = podcastName.replace(/[^\w\s]/g, '').trim();
    const cleanEpisodeTitle = episodeTitle ? episodeTitle.replace(/[^\w\s]/g, '').trim() : '';
    
    let searchQuery;
    if (cleanEpisodeTitle) {
      searchQuery = `${cleanPodcastName} ${cleanEpisodeTitle}`;
    } else {
      searchQuery = cleanPodcastName;
    }
    
    const params = new URLSearchParams({
      term: searchQuery,
    });

    return `https://podcasts.apple.com/search?${params.toString()}`;
  }

  // Enhanced method to find Apple Podcasts URL for a specific episode
  public async findApplePodcastsUrl(episode: Episode): Promise<string> {
    try {
      // First, search for the podcast using just the podcast name
      const podcasts = await this.searchPodcasts(episode.podcast_name, 10);
      
      if (podcasts.length > 0) {
        // Find the best match by podcast name
        const bestMatch = podcasts.find(podcast => {
          const podcastTitle = (podcast.collectionName || '').toLowerCase();
          const artistName = (podcast.artistName || '').toLowerCase();
          const searchName = episode.podcast_name.toLowerCase();
          
          return podcastTitle.includes(searchName) || 
                 searchName.includes(podcastTitle) ||
                 artistName.includes(searchName) ||
                 searchName.includes(artistName);
        }) || podcasts[0];

        if (bestMatch && bestMatch.collectionViewUrl) {
          // Convert web URL to app URL scheme and make it more specific
          const webUrl = bestMatch.collectionViewUrl;
          let appUrl = webUrl.replace('https://podcasts.apple.com/', 'podcasts://podcasts.apple.com/');
          
          // If we have an episode title, try to make the URL more specific
          if (episode.title) {
            // For direct podcast links, we can append search parameters
            const podcastId = bestMatch.collectionId;
            if (podcastId) {
              // Use the podcast ID and search for the specific episode
              const episodeSearchQuery = encodeURIComponent(episode.title);
              appUrl = `podcasts://podcasts.apple.com/podcast/id${podcastId}?search=${episodeSearchQuery}`;
            }
          }
          
          return appUrl;
        }
      }

      // Fallback to search URL with app scheme
      return this.generateApplePodcastsUrl(episode.podcast_name, episode.title);
    } catch (error) {
      console.error('Error finding Apple Podcasts URL:', error);
      return this.generateApplePodcastsUrl(episode.podcast_name, episode.title);
    }
  }

  // Alternative method to generate a more direct Apple Podcasts URL
  public generateDirectApplePodcastsUrl(podcastName: string, episodeTitle?: string): string {
    // Clean the podcast name to make it URL-friendly
    const cleanPodcastName = podcastName
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
    
    if (episodeTitle) {
      const cleanEpisodeTitle = episodeTitle
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      
      // Try to construct a more direct URL format
      return `podcasts://podcasts.apple.com/podcast/${cleanPodcastName}?episode=${cleanEpisodeTitle}`;
    }
    
    return `podcasts://podcasts.apple.com/podcast/${cleanPodcastName}`;
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