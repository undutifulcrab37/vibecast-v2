import { Episode } from '../types';
import { listenNotesService } from './listenNotes';
import { spotifyService } from './spotify';
import { generateCategorySearchTerms } from '../utils/categoryMapping';
import { Mood, Theme } from '../types';

export enum SearchProvider {
  LISTEN_NOTES = 'listen_notes',
  SPOTIFY = 'spotify',
  HYBRID = 'hybrid'
}

export class PodcastService {
  private preferredProvider: SearchProvider = SearchProvider.HYBRID;
  private fallbackToDemo: boolean = false;

  // Set preferred search provider
  public setProvider(provider: SearchProvider): void {
    this.preferredProvider = provider;
    console.log(`🔧 Podcast service provider set to: ${provider}`);
  }

  // Get current provider status
  public getProviderStatus(): { provider: SearchProvider; authenticated: boolean; available: boolean } {
    const spotifyAuth = spotifyService.isAuthenticated();
    
    return {
      provider: this.preferredProvider,
      authenticated: spotifyAuth,
      available: true // Listen Notes doesn't require auth
    };
  }

  // Main search method that intelligently chooses the best strategy
  public async searchEpisodes(
    selectedMoods: Mood[], 
    selectedThemes: Theme[], 
    duration: number = 45
  ): Promise<Episode[]> {
    console.log('🔍 Starting intelligent podcast search...');
    console.log('📊 Search params:', { selectedMoods, selectedThemes, duration, provider: this.preferredProvider });

    const categoryTerms = generateCategorySearchTerms(selectedMoods, selectedThemes);
    const searchQuery = categoryTerms.slice(0, 8).join(' ') || 'podcast';

    let episodes: Episode[] = [];

    try {
      switch (this.preferredProvider) {
        case SearchProvider.SPOTIFY:
          episodes = await this.searchWithSpotify(searchQuery, categoryTerms);
          break;
        
        case SearchProvider.LISTEN_NOTES:
          episodes = await this.searchWithListenNotes(searchQuery, categoryTerms);
          break;
        
        case SearchProvider.HYBRID:
        default:
          episodes = await this.searchWithHybridStrategy(searchQuery, categoryTerms);
          break;
      }

      // Filter by duration if we have enough episodes
      if (episodes.length > 20) {
        const durationSeconds = duration * 60;
        const tolerance = 0.5; // 50% tolerance
        const minDuration = durationSeconds * (1 - tolerance);
        const maxDuration = durationSeconds * (1 + tolerance);
        
        const durationFiltered = episodes.filter(ep => 
          ep.audio_length_sec >= minDuration && ep.audio_length_sec <= maxDuration
        );
        
        if (durationFiltered.length > 5) {
          episodes = durationFiltered;
        }
      }

      console.log(`✅ Podcast search completed: ${episodes.length} episodes found`);
      return episodes;

    } catch (error) {
      console.error('💥 Podcast search failed:', error);
      throw new Error(`Podcast search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Spotify-only search strategy
  private async searchWithSpotify(searchQuery: string, categoryTerms: string[]): Promise<Episode[]> {
    console.log('🎵 Using Spotify search strategy');
    
    if (!spotifyService.isAuthenticated()) {
      throw new Error('Spotify authentication required. Please log in to Spotify first.');
    }

    const episodes: Episode[] = [];

    try {
      // Strategy 1: Combined search (episodes + shows)
      const combinedResults = await spotifyService.searchPodcasts(searchQuery, 50);
      episodes.push(...combinedResults);

      // Strategy 2: Category-based searches
      for (const category of categoryTerms.slice(0, 3)) { // Limit to 3 categories
        try {
          const categoryResults = await spotifyService.searchEpisodes(category, 20);
          episodes.push(...categoryResults);
        } catch (error) {
          console.warn(`⚠️ Spotify category search failed for: ${category}`, error);
        }
      }

      // Remove duplicates
      const uniqueEpisodes = episodes.filter((episode, index, self) => 
        self.findIndex(e => e.id === episode.id) === index
      );

      console.log(`🎵 Spotify search completed: ${uniqueEpisodes.length} unique episodes`);
      return uniqueEpisodes;

    } catch (error) {
      console.error('💥 Spotify search failed:', error);
      throw error;
    }
  }

  // Listen Notes-only search strategy (quota-friendly)
  private async searchWithListenNotes(searchQuery: string, categoryTerms: string[]): Promise<Episode[]> {
    console.log('📻 Using Listen Notes search strategy (quota-friendly)');
    
    const episodes: Episode[] = [];

    try {
      // Strategy 1: Single category search (1 API call)
      if (categoryTerms.length > 0) {
        const bestCategory = categoryTerms[0];
        const categoryEpisodes = await listenNotesService.searchEpisodes(bestCategory, 50);
        episodes.push(...categoryEpisodes);
        console.log(`📻 Listen Notes category search: ${categoryEpisodes.length} episodes`);
      }
      
      // Strategy 2: Single query search if needed (1 API call)
      if (episodes.length < 20 && searchQuery !== 'podcast') {
        const queryEpisodes = await listenNotesService.searchEpisodes(searchQuery, 30);
        episodes.push(...queryEpisodes);
        console.log(`📻 Listen Notes query search: ${queryEpisodes.length} episodes`);
      }

      // Remove duplicates
      const uniqueEpisodes = episodes.filter((episode, index, self) => 
        self.findIndex(e => e.id === episode.id) === index
      );

      console.log(`📻 Listen Notes search completed: ${uniqueEpisodes.length} unique episodes`);
      return uniqueEpisodes;

    } catch (error) {
      console.error('💥 Listen Notes search failed:', error);
      throw error;
    }
  }

  // Hybrid strategy: Use both APIs intelligently
  private async searchWithHybridStrategy(searchQuery: string, categoryTerms: string[]): Promise<Episode[]> {
    console.log('🔀 Using hybrid search strategy');
    
    const episodes: Episode[] = [];
    const errors: string[] = [];

    // Try Spotify first if authenticated (it has better rate limits)
    if (spotifyService.isAuthenticated()) {
      try {
        console.log('🎵 Trying Spotify search first...');
        const spotifyResults = await this.searchWithSpotify(searchQuery, categoryTerms.slice(0, 2));
        episodes.push(...spotifyResults);
        console.log(`✅ Spotify provided ${spotifyResults.length} episodes`);
      } catch (error) {
        console.warn('⚠️ Spotify search failed, will try Listen Notes:', error);
        errors.push(`Spotify: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.log('🔑 Spotify not authenticated, skipping...');
      errors.push('Spotify: Not authenticated');
    }

    // Try Listen Notes if we don't have enough results or Spotify failed
    if (episodes.length < 20) {
      try {
        console.log('📻 Trying Listen Notes search...');
        const listenNotesResults = await this.searchWithListenNotes(searchQuery, categoryTerms.slice(0, 2));
        episodes.push(...listenNotesResults);
        console.log(`✅ Listen Notes provided ${listenNotesResults.length} episodes`);
      } catch (error) {
        console.warn('⚠️ Listen Notes search failed:', error);
        errors.push(`Listen Notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Remove duplicates across services
    const uniqueEpisodes = episodes.filter((episode, index, self) => 
      self.findIndex(e => e.id === episode.id) === index
    );

    if (uniqueEpisodes.length === 0) {
      const errorMessage = `All search providers failed:\n${errors.join('\n')}`;
      console.error('💀 Hybrid search failed completely:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log(`🔀 Hybrid search completed: ${uniqueEpisodes.length} unique episodes from ${episodes.length} total`);
    return uniqueEpisodes;
  }

  // Test all available services
  public async testServices(): Promise<{
    spotify: { success: boolean; message: string; details?: any };
    listenNotes: { success: boolean; message: string; details?: any };
  }> {
    console.log('🧪 Testing all podcast services...');

    const [spotifyTest, listenNotesTest] = await Promise.allSettled([
      spotifyService.testApiConnection(),
      listenNotesService.testApiConnection()
    ]);

    const results = {
      spotify: spotifyTest.status === 'fulfilled' 
        ? spotifyTest.value 
        : { success: false, message: 'Test failed', details: spotifyTest.reason },
      
      listenNotes: listenNotesTest.status === 'fulfilled' 
        ? listenNotesTest.value 
        : { success: false, message: 'Test failed', details: listenNotesTest.reason }
    };

    console.log('🧪 Service test results:', results);
    return results;
  }

  // Get recommendations for provider choice
  public getProviderRecommendation(): { 
    recommended: SearchProvider; 
    reason: string; 
    alternatives: { provider: SearchProvider; pros: string[]; cons: string[] }[] 
  } {
    const spotifyAuth = spotifyService.isAuthenticated();
    
    if (spotifyAuth) {
      return {
        recommended: SearchProvider.HYBRID,
        reason: 'Spotify is authenticated, hybrid mode provides best coverage and rate limits',
        alternatives: [
          {
            provider: SearchProvider.SPOTIFY,
            pros: ['No monthly limits', 'Better rate limits', 'Native playback'],
            cons: ['Limited to Spotify content', 'Requires authentication']
          },
          {
            provider: SearchProvider.LISTEN_NOTES,
            pros: ['Comprehensive podcast database', 'No authentication needed'],
            cons: ['300 requests/month limit', 'May hit quota quickly']
          }
        ]
      };
    } else {
      return {
        recommended: SearchProvider.LISTEN_NOTES,
        reason: 'Spotify not authenticated, Listen Notes provides comprehensive coverage',
        alternatives: [
          {
            provider: SearchProvider.SPOTIFY,
            pros: ['Better rate limits after authentication'],
            cons: ['Requires Spotify login first', 'Limited content scope']
          },
          {
            provider: SearchProvider.HYBRID,
            pros: ['Best of both worlds when Spotify is authenticated'],
            cons: ['Currently limited to Listen Notes only']
          }
        ]
      };
    }
  }
}

export const podcastService = new PodcastService(); 