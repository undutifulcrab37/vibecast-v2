import { ListenNotesEpisode, Episode } from '../types';
import { config } from '../config';

const LISTEN_NOTES_API_KEY = config.listenNotes.apiKey;
const LISTEN_NOTES_BASE_URL = config.listenNotes.baseUrl;

export class ListenNotesService {
  private async makeRequest(endpoint: string): Promise<any> {
    try {
      const fullUrl = `${LISTEN_NOTES_BASE_URL}${endpoint}`;
      console.log('🌐 Making Listen Notes API request to:', fullUrl);
      console.log('🔑 API Key length:', LISTEN_NOTES_API_KEY?.length || 0);
      console.log('🔑 API Key starts with:', LISTEN_NOTES_API_KEY?.substring(0, 8) + '...');
      
      const response = await fetch(fullUrl, {
        headers: {
          'X-ListenAPI-Key': LISTEN_NOTES_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Listen Notes API response status:', response.status, response.statusText);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Listen Notes API error details:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          endpoint: endpoint,
          apiKeyLength: LISTEN_NOTES_API_KEY?.length || 0,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (response.status === 401) {
          console.error('🔑 API Key Issue: Invalid or missing Listen Notes API key');
          console.error('🔑 Current API key:', LISTEN_NOTES_API_KEY?.substring(0, 16) + '...');
          throw new Error('Listen Notes API authentication failed - check API key configuration');
        }
        
        if (response.status === 429) {
          console.error('🚫 Rate Limited: Too many requests to Listen Notes API');
          throw new Error('Listen Notes API rate limited - please try again in a moment');
        }
        
        if (response.status === 404) {
          console.error('🔍 Not Found: Listen Notes API endpoint not found');
          throw new Error('Listen Notes API endpoint not found');
        }

        if (response.status === 403) {
          console.error('🚫 Forbidden: API key may not have required permissions');
          throw new Error('Listen Notes API access forbidden - check API key permissions');
        }
        
        throw new Error(`Listen Notes API error: ${response.status} - ${errorText}`);
      }

      const jsonData = await response.json();
      console.log('✅ Listen Notes API request successful');
      console.log('📊 Response data structure:', {
        hasResults: !!jsonData.results,
        resultsLength: jsonData.results?.length || 0,
        total: jsonData.total || 'unknown',
        count: jsonData.count || 'unknown'
      });
      return jsonData;
    } catch (error) {
      console.error('💥 Listen Notes API request failed:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 Network Error: Unable to reach Listen Notes API');
        console.error('🌐 Check internet connection and firewall settings');
        throw new Error('Network error - unable to reach Listen Notes API');
      }
      
      throw error;
    }
  }

  public async searchEpisodes(query: string, limit: number = 20): Promise<Episode[]> {
    try {
      // Listen Notes API has a maximum limit, so we'll cap it at 100
      const actualLimit = Math.min(limit, 100);
      
      // First attempt with full parameters
      let params = new URLSearchParams({
        q: query,
        type: 'episode',
        len_min: '5',
        len_max: '180',
        published_after: String(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
        safe_mode: '1',
        sort_by_date: '0', // Sort by relevance
      });

      console.log('🔍 Listen Notes API call details:');
      console.log('  Query:', query);
      console.log('  Params:', params.toString());
      console.log('  Requested limit:', actualLimit);

      let data;
      try {
        data = await this.makeRequest(`/search?${params.toString()}`);
      } catch (error) {
        console.warn('⚠️ Full search failed, trying simpler search...', error);
        
        // Fallback: Try with minimal parameters
        params = new URLSearchParams({
          q: query,
          type: 'episode',
          safe_mode: '1',
        });
        
        console.log('🔄 Retrying with minimal params:', params.toString());
        data = await this.makeRequest(`/search?${params.toString()}`);
      }
      
      console.log('📊 Listen Notes API response analysis:', {
        hasData: !!data,
        hasResults: !!(data && data.results),
        resultsIsArray: !!(data && data.results && Array.isArray(data.results)),
        count: data?.count || 'unknown',
        total: data?.total || 'unknown',
        resultsLength: data?.results?.length || 0,
        requestedLimit: actualLimit,
        responseKeys: data ? Object.keys(data) : 'no data'
      });
      
      // Safely handle the response structure
      if (!data) {
        console.error('❌ Listen Notes returned null/undefined data');
        return [];
      }
      
      if (!data.results) {
        console.error('❌ Listen Notes response missing results field:', data);
        return [];
      }
      
      if (!Array.isArray(data.results)) {
        console.error('❌ Listen Notes results is not an array:', typeof data.results, data.results);
        return [];
      }
      
      if (data.results.length === 0) {
        console.warn('⚠️ Listen Notes returned empty results array for query:', query);
        return [];
      }
      
      console.log('✅ Listen Notes returned valid results, processing...');
      
      const episodes = data.results.slice(0, actualLimit)
        .filter((episode: any) => {
          if (!episode) {
            console.warn('⚠️ Skipping null/undefined episode');
            return false;
          }
          if (!episode.id) {
            console.warn('⚠️ Skipping episode without ID:', episode);
            return false;
          }
          return true;
        })
        .map((episode: any) => {
          try {
            return this.convertListenNotesEpisode(episode);
          } catch (error) {
            console.error('❌ Error converting Listen Notes episode:', error, episode);
            return null;
          }
        })
        .filter((episode: Episode | null): episode is Episode => episode !== null);

      console.log(`✅ Listen Notes successfully converted ${episodes.length}/${data.results.length} episodes for query: "${query}"`);
      return episodes;
    } catch (error) {
      console.error('💥 Listen Notes searchEpisodes failed for query:', query, error);
      
      // Log additional diagnostic info
      if (error instanceof Error) {
        console.error('  Error message:', error.message);
        console.error('  Error stack:', error.stack);
      }
      
      return [];
    }
  }

  // Enhanced method to search for best podcasts within categories
  public async searchEpisodesByCategory(categories: string[], limit: number = 50): Promise<Episode[]> {
    const allEpisodes: Episode[] = [];
    
    // Search for episodes using category terms
    for (const category of categories.slice(0, 5)) { // Limit to first 5 categories to avoid too many API calls
      try {
        console.log(`Searching for episodes in category: ${category}`);
        const categoryEpisodes = await this.searchEpisodes(category, Math.ceil(limit / categories.length));
        allEpisodes.push(...categoryEpisodes);
      } catch (error) {
        console.error(`Error searching category ${category}:`, error);
      }
    }
    
    // Remove duplicates based on episode ID
    const uniqueEpisodes = allEpisodes.filter((episode, index, self) => 
      self.findIndex(e => e.id === episode.id) === index
    );
    
    console.log(`Found ${uniqueEpisodes.length} unique episodes across ${categories.length} categories`);
    return uniqueEpisodes.slice(0, limit);
  }

  public async getBestPodcasts(genre?: string): Promise<Episode[]> {
    try {
      const params = new URLSearchParams({
        region: 'us',
        safe_mode: '1',
      });

      if (genre) {
        params.append('genre_id', genre);
      }

      const data = await this.makeRequest(`/best_podcasts?${params.toString()}`);
      
      // Get episodes from the first few podcasts
      const episodes: Episode[] = [];
      for (const podcast of data.podcasts.slice(0, 5)) {
        try {
          const podcastData = await this.makeRequest(`/podcasts/${podcast.id}?next_episode_pub_date=1577836800000`);
          episodes.push(...podcastData.episodes.slice(0, 4).map((episode: ListenNotesEpisode) => this.convertListenNotesEpisode(episode)));
        } catch (error) {
          console.error('Error fetching podcast episodes:', error);
        }
      }
      
      return episodes;
    } catch (error) {
      console.error('Error fetching best podcasts:', error);
      return [];
    }
  }

  // Test method to verify API key and connectivity
  public async testApiConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🧪 Testing Listen Notes API connection...');
      
      // Simple test: search for "podcast" which should always return results
      const testParams = new URLSearchParams({
        q: 'podcast',
        type: 'episode',
        len_min: '5',
        len_max: '60',
        safe_mode: '1'
      });

      const data = await this.makeRequest(`/search?${testParams.toString()}`);
      
      if (data && data.results && Array.isArray(data.results) && data.results.length > 0) {
        return {
          success: true,
          message: 'Listen Notes API is working correctly',
          details: {
            resultCount: data.results.length,
            totalAvailable: data.total,
            sampleEpisode: data.results[0]?.title || 'No title'
          }
        };
      } else {
        return {
          success: false,
          message: 'Listen Notes API returned empty or invalid results',
          details: data
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Listen Notes API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    
    // Remove extra whitespace and newlines
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Only return the cleaned text without length limitation
    // The UI component will handle truncation and expansion
    return cleaned || 'No description available';
  }

  private convertListenNotesEpisode(episode: any): Episode {
    // Handle both highlighted and original field names
    const title = episode.title_original || episode.title || 'Untitled Episode';
    const rawDescription = episode.description_original || episode.description || 'No description available';
    // Clean the description but preserve ALL content - no truncation
    const description = this.cleanDescription(rawDescription);
    const podcastTitle = episode.podcast?.title_original || episode.podcast?.title || 'Unknown Podcast';
    const coverArt = episode.podcast?.image || episode.image || undefined;
    const audioLength = episode.audio_length_sec || 0;
    const externalUrl = episode.listennotes_url || episode.external_url || undefined;
    const pubDate = episode.pub_date_ms || Date.now();

    console.log('Converting Listen Notes episode:', {
      id: episode.id,
      title,
      descriptionLength: description.length,
      rawDescriptionLength: rawDescription.length,
      podcast_name: podcastTitle,
      audio_length_sec: audioLength
    });

    return {
      id: episode.id,
      title,
      description, // This now contains the full cleaned description
      audio_length_sec: audioLength,
      podcast_name: podcastTitle,
      cover_art: coverArt,
      external_url: externalUrl,
      published_at: new Date(pubDate).toISOString(),
    };
  }
}

export const listenNotesService = new ListenNotesService(); 