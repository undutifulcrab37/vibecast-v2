import { UserRating, RatingData, Mood, Theme } from '../types';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create Supabase client if credentials are provided
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export class RatingService {
  private readonly STORAGE_KEY = 'vibecast_ratings';
  private readonly USE_SUPABASE = !!supabase; // Auto-enable if Supabase is configured

  // Main rating save method
  public async saveRating(rating: UserRating): Promise<void> {
    if (this.USE_SUPABASE) {
      await this.saveRatingToSupabase(rating);
    } else {
      this.saveRatingToLocalStorage(rating);
    }
  }

  // Main rating fetch method
  public async getAllRatings(): Promise<UserRating[]> {
    if (this.USE_SUPABASE) {
      return await this.getAllRatingsFromSupabase();
    } else {
      return this.getAllRatingsFromLocalStorage();
    }
  }

  // localStorage methods (fallback)
  private saveRatingToLocalStorage(rating: UserRating): void {
    const ratings = this.getAllRatingsFromLocalStorage();
    ratings.push(rating);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ratings));
  }

  private getAllRatingsFromLocalStorage(): UserRating[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Supabase methods
  private async saveRatingToSupabase(rating: UserRating): Promise<void> {
    if (!supabase) {
      console.error('Supabase not configured');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ratings')
        .insert([{
          episode_id: rating.episodeId,
          rating: rating.rating,
          mood: rating.mood,
          themes: rating.themes,
          timestamp: rating.timestamp,
          comment: rating.comment || null,
        }]);

      if (error) {
        console.error('Error saving rating to Supabase:', error);
        // Fallback to localStorage
        this.saveRatingToLocalStorage(rating);
      } else {
        console.log('Rating saved to Supabase successfully');
      }
    } catch (error) {
      console.error('Supabase connection error:', error);
      // Fallback to localStorage
      this.saveRatingToLocalStorage(rating);
    }
  }

  private async getAllRatingsFromSupabase(): Promise<UserRating[]> {
    if (!supabase) {
      console.error('Supabase not configured');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*');

      if (error) {
        console.error('Error fetching ratings from Supabase:', error);
        return this.getAllRatingsFromLocalStorage(); // Fallback
      }

      // Convert Supabase format to UserRating format
      return data.map(row => ({
        episodeId: row.episode_id,
        rating: row.rating,
        mood: row.mood,
        themes: row.themes,
        timestamp: row.timestamp,
        comment: row.comment,
      }));
    } catch (error) {
      console.error('Supabase connection error:', error);
      return this.getAllRatingsFromLocalStorage(); // Fallback
    }
  }

  // Updated to work with async data
  public async getRatingData(episodeId: string): Promise<RatingData | null> {
    const ratings = (await this.getAllRatings()).filter(r => r.episodeId === episodeId);
    
    if (ratings.length === 0) return null;

    const totalRatings = ratings.length;
    const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

    // Calculate mood-specific ratings
    const moodRatings: Record<Mood, { sum: number; count: number }> = {
      happy: { sum: 0, count: 0 },
      sad: { sum: 0, count: 0 },
      anxious: { sum: 0, count: 0 },
      bored: { sum: 0, count: 0 },
      curious: { sum: 0, count: 0 },
      tired: { sum: 0, count: 0 },
      focused: { sum: 0, count: 0 },
      stressed: { sum: 0, count: 0 },
      surprise_me: { sum: 0, count: 0 },
      dont_know: { sum: 0, count: 0 },
    };

    // Calculate theme-specific ratings
    const themeRatings: Record<Theme, { sum: number; count: number }> = {
      laugh: { sum: 0, count: 0 },
      cry: { sum: 0, count: 0 },
      learn: { sum: 0, count: 0 },
      be_inspired: { sum: 0, count: 0 },
      escape: { sum: 0, count: 0 },
      chill: { sum: 0, count: 0 },
      be_distracted: { sum: 0, count: 0 },
      be_shocked: { sum: 0, count: 0 },
      reflect: { sum: 0, count: 0 },
      stay_updated: { sum: 0, count: 0 },
      feel_seen: { sum: 0, count: 0 },
      kill_time: { sum: 0, count: 0 },
    };

    ratings.forEach(rating => {
      rating.mood.forEach(mood => {
        moodRatings[mood].sum += rating.rating;
        moodRatings[mood].count += 1;
      });

      rating.themes.forEach(theme => {
        themeRatings[theme].sum += rating.rating;
        themeRatings[theme].count += 1;
      });
    });

    return {
      episodeId,
      averageRating,
      totalRatings,
      moodRatings,
      themeRatings,
    };
  }

  public async getAverageRatingForMoodTheme(mood: Mood, theme: Theme): Promise<number> {
    const ratings = (await this.getAllRatings()).filter(r => 
      r.mood.includes(mood) && r.themes.includes(theme)
    );
    
    if (ratings.length === 0) return 0;
    
    return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  }

  public async getEpisodeRatingBonus(episodeId: string, userMoods: Mood[], userThemes: Theme[]): Promise<number> {
    const ratingData = await this.getRatingData(episodeId);
    
    if (!ratingData || ratingData.totalRatings === 0) return 0;

    let bonus = 0;
    
    // Base bonus from overall rating
    if (ratingData.averageRating > 3.5) {
      bonus += (ratingData.averageRating - 3.5) * 2;
    }
    
    // Mood-specific bonus
    userMoods.forEach(mood => {
      const moodRating = ratingData.moodRatings[mood];
      if (moodRating.count > 0) {
        const avgMoodRating = moodRating.sum / moodRating.count;
        if (avgMoodRating > 3.5) {
          bonus += (avgMoodRating - 3.5) * 3; // Higher weight for mood matches
        }
      }
    });

    // Theme-specific bonus
    userThemes.forEach(theme => {
      const themeRating = ratingData.themeRatings[theme];
      if (themeRating.count > 0) {
        const avgThemeRating = themeRating.sum / themeRating.count;
        if (avgThemeRating > 3.5) {
          bonus += (avgThemeRating - 3.5) * 2;
        }
      }
    });

    return bonus;
  }

  // Helper method to check if Supabase is configured
  public isSupabaseConfigured(): boolean {
    return this.USE_SUPABASE;
  }
}

export const ratingService = new RatingService(); 