import { Mood, Theme } from '../types';

// Podcast categories based on Apple Podcasts/Listen Notes categories
export const podcastCategories = {
  'Arts': ['Books', 'Design', 'Fashion & Beauty', 'Food', 'Performing Arts', 'Visual Arts'],
  'Business': ['Careers', 'Entrepreneurship', 'Investing', 'Management', 'Marketing', 'Non-Profit'],
  'Comedy': ['Comedy Interviews', 'Improv', 'Stand-Up', 'Entertainment', 'Talk Shows', 'Radio Comedy'],
  'Education': ['Courses', 'How To', 'Language Learning', 'Self-Improvement'],
  'Fiction': ['Comedy Fiction', 'Drama', 'Science Fiction'],
  'Government': [],
  'History': [],
  'Health & Fitness': ['Alternative Health', 'Fitness', 'Medicine', 'Mental Health', 'Nutrition', 'Sexuality'],
  'Leisure': ['Animation & Manga', 'Automotive', 'Aviation', 'Crafts', 'Games', 'Hobbies', 'Home & Garden', 'Video Games'],
  'Music': ['Music Commentary', 'Music History', 'Music Interviews'],
  'News': ['Business News', 'Daily News', 'Entertainment News', 'News Commentary', 'Politics', 'Sports News', 'Tech News'],
  'Religion & Spirituality': ['Buddhism', 'Christianity', 'Hinduism', 'Islam', 'Judaism', 'Religion', 'Spirituality'],
  'Science': ['Astronomy', 'Chemistry', 'Earth Sciences', 'Life Sciences', 'Mathematics', 'Natural Sciences', 'Nature', 'Physics', 'Social Sciences'],
  'Society & Culture': ['Documentary', 'Personal Journals', 'Philosophy', 'Places & Travel', 'Relationships'],
  'Sports': ['Baseball', 'Basketball', 'Cricket', 'Fantasy Sports', 'Football', 'Golf', 'Hockey', 'Rugby', 'Soccer', 'Swimming', 'Tennis', 'Volleyball', 'Wilderness', 'Wrestling'],
  'Technology': [],
  'True Crime': [],
  'TV & Film': ['After Shows', 'Film History', 'Film Interviews', 'Film Reviews', 'TV Reviews']
};

// Map user moods to podcast categories (primary and secondary matches)
export const moodToCategoryMap: Record<Mood, { primary: string[]; secondary: string[] }> = {
  happy: {
    primary: ['Comedy', 'Music', 'Health & Fitness'],
    secondary: ['Arts', 'Leisure', 'Society & Culture']
  },
  sad: {
    primary: ['Health & Fitness', 'Society & Culture', 'Religion & Spirituality'],
    secondary: ['Music', 'Arts', 'Education']
  },
  anxious: {
    primary: ['Health & Fitness', 'Religion & Spirituality', 'Education'],
    secondary: ['Society & Culture', 'Music']
  },
  bored: {
    primary: ['Comedy', 'TV & Film', 'Leisure'],
    secondary: ['True Crime', 'News', 'Sports']
  },
  curious: {
    primary: ['Science', 'Education', 'History'],
    secondary: ['Technology', 'News', 'Society & Culture']
  },
  tired: {
    primary: ['Health & Fitness', 'Religion & Spirituality', 'Music'],
    secondary: ['Society & Culture', 'Fiction']
  },
  focused: {
    primary: ['Education', 'Business', 'Science'],
    secondary: ['Technology', 'Health & Fitness', 'News']
  },
  stressed: {
    primary: ['Health & Fitness', 'Religion & Spirituality', 'Music'],
    secondary: ['Comedy', 'Society & Culture']
  },
  surprise_me: {
    primary: ['Comedy', 'True Crime', 'Science'],
    secondary: ['Fiction', 'TV & Film', 'Leisure']
  },
  dont_know: {
    primary: ['Comedy', 'News', 'Society & Culture'],
    secondary: ['Education', 'Health & Fitness', 'Arts']
  }
};

// Map user themes to podcast categories (primary and secondary matches)
export const themeToCategoryMap: Record<Theme, { primary: string[]; secondary: string[] }> = {
  laugh: {
    primary: ['Comedy'],
    secondary: ['TV & Film', 'Leisure']
  },
  cry: {
    primary: ['Fiction', 'Society & Culture'],
    secondary: ['Health & Fitness', 'True Crime']
  },
  learn: {
    primary: ['Education', 'Science', 'History'],
    secondary: ['Technology', 'Business', 'News']
  },
  be_inspired: {
    primary: ['Education', 'Business', 'Health & Fitness'],
    secondary: ['Religion & Spirituality', 'Society & Culture']
  },
  escape: {
    primary: ['Fiction', 'True Crime', 'TV & Film'],
    secondary: ['Science Fiction', 'Arts', 'Leisure']
  },
  chill: {
    primary: ['Health & Fitness', 'Religion & Spirituality', 'Music'],
    secondary: ['Society & Culture', 'Nature']
  },
  be_distracted: {
    primary: ['Comedy', 'Leisure', 'TV & Film'],
    secondary: ['Music', 'Sports', 'Arts']
  },
  be_shocked: {
    primary: ['True Crime', 'News'],
    secondary: ['Society & Culture', 'Government']
  },
  reflect: {
    primary: ['Religion & Spirituality', 'Society & Culture', 'Health & Fitness'],
    secondary: ['Philosophy', 'Education', 'Arts']
  },
  stay_updated: {
    primary: ['News', 'Technology', 'Business'],
    secondary: ['Science', 'Government', 'Sports']
  },
  feel_seen: {
    primary: ['Society & Culture', 'Health & Fitness', 'Religion & Spirituality'],
    secondary: ['Personal Journals', 'Relationships', 'Arts']
  },
  kill_time: {
    primary: ['Comedy', 'Leisure', 'TV & Film'],
    secondary: ['Sports', 'Music', 'True Crime']
  }
};

// Get all relevant categories for a set of moods and themes
export function getCategoriesForUserSelection(moods: Mood[], themes: Theme[]): {
  primary: string[];
  secondary: string[];
  subcategories: string[];
} {
  const primaryCategories = new Set<string>();
  const secondaryCategories = new Set<string>();
  const subcategories = new Set<string>();

  // Process moods
  moods.forEach(mood => {
    const mapping = moodToCategoryMap[mood];
    if (mapping) {
      mapping.primary.forEach(cat => primaryCategories.add(cat));
      mapping.secondary.forEach(cat => secondaryCategories.add(cat));
    }
  });

  // Process themes
  themes.forEach(theme => {
    const mapping = themeToCategoryMap[theme];
    if (mapping) {
      mapping.primary.forEach(cat => primaryCategories.add(cat));
      mapping.secondary.forEach(cat => secondaryCategories.add(cat));
    }
  });

  // Get subcategories for all primary and secondary categories
  [...primaryCategories, ...secondaryCategories].forEach(category => {
    const subs = podcastCategories[category as keyof typeof podcastCategories];
    if (subs) {
      subs.forEach(sub => subcategories.add(sub));
    }
  });

  return {
    primary: Array.from(primaryCategories),
    secondary: Array.from(secondaryCategories),
    subcategories: Array.from(subcategories)
  };
}

// Generate category-based search terms instead of keyword-based
export function generateCategorySearchTerms(moods: Mood[], themes: Theme[]): string[] {
  const categories = getCategoriesForUserSelection(moods, themes);
  
  // Combine primary categories, secondary categories, and subcategories
  const allTerms = [
    ...categories.primary,
    ...categories.secondary,
    ...categories.subcategories
  ];

  // Remove duplicates and return
  return Array.from(new Set(allTerms));
} 