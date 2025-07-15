import { createClient } from '@supabase/supabase-js';
import { UserRating, RatingData } from '../types';

// Enhanced interfaces for better tracking
interface ImplicitFeedback {
  episodeId: string;
  playTime: number;      // Seconds actually listened
  totalTime: number;     // Total episode length
  completionRate: number; // playTime / totalTime
  skipTime?: number;     // Time when user skipped (if applicable)
  timestamp: string;
  sessionId: string;     // Track session-based patterns
}

interface UserPreference {
  mood: string;
  theme: string;
  weight: number;        // -1 to 1, how much user likes this combo
  episodeCount: number;  // How many episodes with this combo
  avgRating: number;     // Average rating for this combo
  lastUpdated: string;
}

// Use environment variables with fallbacks
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Only create Supabase client if credentials are provided
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export class RatingService {
  private readonly STORAGE_KEY = 'vibecast_ratings';
  private readonly PREFERENCES_KEY = 'vibecast_user_preferences';
  private readonly IMPLICIT_FEEDBACK_KEY = 'vibecast_implicit_feedback';
  private readonly USE_SUPABASE = !!supabase; // Auto-enable if Supabase is configured

  // Enhanced rating save with preference learning
  public async saveRating(rating: UserRating): Promise<void> {
    if (this.USE_SUPABASE) {
      await this.saveRatingToSupabase(rating);
    } else {
      this.saveRatingToLocalStorage(rating);
    }

    // Update user preferences based on this rating
    await this.updateUserPreferences(rating);
  }

  // New method to track implicit feedback
  public async trackImplicitFeedback(feedback: ImplicitFeedback): Promise<void> {
    if (this.USE_SUPABASE) {
      await this.saveImplicitFeedbackToSupabase(feedback);
    } else {
      this.saveImplicitFeedbackToLocalStorage(feedback);
    }
  }

  // Enhanced method to get personalized episode rating bonus
  public async getEpisodeRatingBonus(episodeId: string, userMoods: any[], userThemes: any[]): Promise<number> {
    let bonus = 0;
    
    // Get explicit rating data
    const ratingData = await this.getRatingData(episodeId);
    if (ratingData) {
      // Bonus for episodes with good overall ratings
      if (ratingData.averageRating > 3.5) {
        bonus += (ratingData.averageRating - 3) * 2; // Up to +2 for 5-star episodes
      }
      
      // Bonus for mood/theme specific ratings
      for (const mood of userMoods) {
        const moodRating = (ratingData.moodRatings as any)[mood];
        if (moodRating && moodRating.count > 0) {
          const avgRating = moodRating.sum / moodRating.count;
          bonus += (avgRating - 3) * 1.5; // Scale: -3 to +3
        }
      }
      
      for (const theme of userThemes) {
        const themeRating = (ratingData.themeRatings as any)[theme];
        if (themeRating && themeRating.count > 0) {
          const avgRating = themeRating.sum / themeRating.count;
          bonus += (avgRating - 3) * 1.5; // Scale: -3 to +3
        }
      }
    }

    // Get user preference data for personalization
    const userPreferences = await this.getUserPreferences();
    for (const mood of userMoods) {
      for (const theme of userThemes) {
        const prefKey = `${mood}_${theme}`;
        const preference = userPreferences.find(p => `${p.mood}_${p.theme}` === prefKey);
        if (preference) {
          bonus += preference.weight * 3; // Scale: -3 to +3
        }
      }
    }

    // Get implicit feedback bonus
    const implicitBonus = await this.getImplicitFeedbackBonus(episodeId);
    bonus += implicitBonus;
    
    return Math.max(-5, Math.min(5, bonus)); // Cap bonus at ±5
  }

  // Update user preferences based on explicit ratings
  private async updateUserPreferences(rating: UserRating): Promise<void> {
    const preferences = await this.getUserPreferences();
    
    // Update preferences for each mood-theme combination
    for (const mood of rating.mood) {
      for (const theme of rating.themes) {
        const prefKey = `${mood}_${theme}`;
        let preference = preferences.find(p => `${p.mood}_${p.theme}` === prefKey);
        
        if (!preference) {
          preference = {
            mood,
            theme,
            weight: 0,
            episodeCount: 0,
            avgRating: 3,
            lastUpdated: new Date().toISOString()
          };
          preferences.push(preference);
        }
        
        // Update preference weight using exponential moving average
        const alpha = 0.3; // Learning rate
        const normalizedRating = (rating.rating - 3) / 2; // Convert 1-5 to -1 to 1
        preference.weight = preference.weight * (1 - alpha) + normalizedRating * alpha;
        preference.episodeCount += 1;
        preference.avgRating = (preference.avgRating * (preference.episodeCount - 1) + rating.rating) / preference.episodeCount;
        preference.lastUpdated = new Date().toISOString();
      }
    }
    
    // Save updated preferences
    await this.saveUserPreferences(preferences);
  }

  // Get implicit feedback bonus based on listening patterns
  private async getImplicitFeedbackBonus(episodeId: string): Promise<number> {
    const feedback = await this.getImplicitFeedback();
    const episodeFeedback = feedback.filter(f => f.episodeId === episodeId);
    
    if (episodeFeedback.length === 0) return 0;
    
    // Calculate average completion rate
    const avgCompletionRate = episodeFeedback.reduce((sum, f) => sum + f.completionRate, 0) / episodeFeedback.length;
    
    // High completion rate = positive bonus
    if (avgCompletionRate > 0.8) {
      return 2; // High engagement
    } else if (avgCompletionRate > 0.5) {
      return 1; // Medium engagement
    } else if (avgCompletionRate < 0.2) {
      return -2; // Low engagement (likely skipped)
    }
    
    return 0;
  }

  // User preference management
  private async getUserPreferences(): Promise<UserPreference[]> {
    if (this.USE_SUPABASE) {
      return await this.getUserPreferencesFromSupabase();
    } else {
      return this.getUserPreferencesFromLocalStorage();
    }
  }

  private async saveUserPreferences(preferences: UserPreference[]): Promise<void> {
    if (this.USE_SUPABASE) {
      await this.saveUserPreferencesToSupabase(preferences);
    } else {
      this.saveUserPreferencesToLocalStorage(preferences);
    }
  }

  private getUserPreferencesFromLocalStorage(): UserPreference[] {
    const stored = localStorage.getItem(this.PREFERENCES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveUserPreferencesToLocalStorage(preferences: UserPreference[]): void {
    localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
  }

  // Implicit feedback management
  private async getImplicitFeedback(): Promise<ImplicitFeedback[]> {
    if (this.USE_SUPABASE) {
      return await this.getImplicitFeedbackFromSupabase();
    } else {
      return this.getImplicitFeedbackFromLocalStorage();
    }
  }

  private getImplicitFeedbackFromLocalStorage(): ImplicitFeedback[] {
    const stored = localStorage.getItem(this.IMPLICIT_FEEDBACK_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveImplicitFeedbackToLocalStorage(feedback: ImplicitFeedback): void {
    const allFeedback = this.getImplicitFeedbackFromLocalStorage();
    allFeedback.push(feedback);
    
    // Keep only last 1000 feedback entries to manage storage
    const recentFeedback = allFeedback.slice(-1000);
    localStorage.setItem(this.IMPLICIT_FEEDBACK_KEY, JSON.stringify(recentFeedback));
  }

  // Supabase methods for preferences
  private async getUserPreferencesFromSupabase(): Promise<UserPreference[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*');

      if (error) {
        console.error('Error fetching preferences from Supabase:', error);
        return this.getUserPreferencesFromLocalStorage();
      }

      return data || [];
    } catch (error) {
      console.error('Supabase preferences error:', error);
      return this.getUserPreferencesFromLocalStorage();
    }
  }

  private async saveUserPreferencesToSupabase(preferences: UserPreference[]): Promise<void> {
    if (!supabase) return;
    
    try {
      // Clear existing preferences and insert new ones
      await supabase.from('user_preferences').delete().neq('id', 0);
      
      const { error } = await supabase
        .from('user_preferences')
        .insert(preferences);

      if (error) {
        console.error('Error saving preferences to Supabase:', error);
        this.saveUserPreferencesToLocalStorage(preferences);
      }
    } catch (error) {
      console.error('Supabase preferences save error:', error);
      this.saveUserPreferencesToLocalStorage(preferences);
    }
  }

  // Supabase methods for implicit feedback
  private async getImplicitFeedbackFromSupabase(): Promise<ImplicitFeedback[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('implicit_feedback')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('Error fetching implicit feedback from Supabase:', error);
        return this.getImplicitFeedbackFromLocalStorage();
      }

      return data || [];
    } catch (error) {
      console.error('Supabase implicit feedback error:', error);
      return this.getImplicitFeedbackFromLocalStorage();
    }
  }

  private async saveImplicitFeedbackToSupabase(feedback: ImplicitFeedback): Promise<void> {
    if (!supabase) {
      this.saveImplicitFeedbackToLocalStorage(feedback);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('implicit_feedback')
        .insert([feedback]);

      if (error) {
        console.error('Error saving implicit feedback to Supabase:', error);
        this.saveImplicitFeedbackToLocalStorage(feedback);
      }
    } catch (error) {
      console.error('Supabase implicit feedback save error:', error);
      this.saveImplicitFeedbackToLocalStorage(feedback);
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
      const { error } = await supabase
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
      console.error('Error saving rating to Supabase:', error);
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
    const moodRatings: Record<any, { sum: number; count: number }> = {
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
    const themeRatings: Record<any, { sum: number; count: number }> = {
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

  public async getAverageRatingForMoodTheme(mood: any, theme: any): Promise<number> {
    const ratings = (await this.getAllRatings()).filter(r => 
      r.mood.includes(mood) && r.themes.includes(theme)
    );
    
    if (ratings.length === 0) return 0;
    
    return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  }

  // Helper method to check if Supabase is configured
  public isSupabaseConfigured(): boolean {
    return this.USE_SUPABASE;
  }

  // New utility methods for algorithm insights
  public async getUserPreferencesSummary(): Promise<{
    topMoodThemeCombos: Array<{combo: string, weight: number, episodes: number}>,
    totalRatings: number,
    avgRating: number
  }> {
    const preferences = await this.getUserPreferences();
    const ratings = await this.getAllRatings();
    
    const topCombos = preferences
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10)
      .map(p => ({
        combo: `${p.mood} + ${p.theme.replace('_', ' ')}`,
        weight: Math.round(p.weight * 100) / 100,
        episodes: p.episodeCount
      }));
    
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;
    
    return {
      topMoodThemeCombos: topCombos,
      totalRatings: ratings.length,
      avgRating: Math.round(avgRating * 100) / 100
    };
  }
}

export const ratingService = new RatingService(); 