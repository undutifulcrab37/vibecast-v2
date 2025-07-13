import { ListenNotesEpisode, Episode } from '../types';
import { config } from '../config';

const LISTEN_NOTES_API_KEY = config.listenNotes.apiKey;
const LISTEN_NOTES_BASE_URL = config.listenNotes.baseUrl;

export class ListenNotesService {
  private async makeRequest(endpoint: string): Promise<any> {
    const response = await fetch(`${LISTEN_NOTES_BASE_URL}${endpoint}`, {
      headers: {
        'X-ListenAPI-Key': LISTEN_NOTES_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Listen Notes API error: ${response.status}`);
    }

    return response.json();
  }

  public async searchEpisodes(query: string, limit: number = 20): Promise<Episode[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        type: 'episode',
        len_min: '5',
        len_max: '180',
        published_after: String(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
        safe_mode: '1',
      });

      const data = await this.makeRequest(`/search?${params.toString()}`);
      
      return data.results.slice(0, limit).map((episode: ListenNotesEpisode) => this.convertListenNotesEpisode(episode));
    } catch (error) {
      console.error('Error searching Listen Notes episodes:', error);
      return [];
    }
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

  private convertListenNotesEpisode(episode: ListenNotesEpisode): Episode {
    return {
      id: episode.id,
      title: episode.title,
      description: episode.description,
      audio_length_sec: episode.audio_length_sec,
      podcast_name: episode.podcast.title,
      cover_art: episode.podcast.image,
      external_url: episode.listennotes_url,
      published_at: new Date(episode.pub_date_ms).toISOString(),
    };
  }
}

export const listenNotesService = new ListenNotesService(); 