import { Episode } from '../types';

export const demoEpisodes: Episode[] = [
  {
    id: 'demo-1',
    title: 'The Science of Happiness: What Makes Us Truly Happy',
    description: 'Explore the latest research on happiness and well-being. Learn practical strategies to boost your mood and live a more fulfilling life. This episode covers positive psychology, gratitude practices, and the neuroscience of joy.',
    audio_length_sec: 2700, // 45 minutes
    podcast_name: 'The Happiness Lab',
    cover_art: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
    external_url: 'https://example.com/episode1',
    published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-2',
    title: 'True Crime: The Mystery of the Missing Heiress',
    description: 'A gripping investigation into the disappearance of a wealthy socialite. Follow the clues, examine the evidence, and dive deep into this unsolved mystery that has baffled investigators for decades. Unbelievable twists and shocking revelations.',
    audio_length_sec: 3600, // 60 minutes
    podcast_name: 'Mystery Files',
    cover_art: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
    external_url: 'https://example.com/episode2',
    published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-3',
    title: 'Comedy Gold: Stand-Up Stories from the Road',
    description: 'Hilarious tales from touring comedians. Laugh along as they share their funniest moments, biggest failures, and the weird encounters that happen on the comedy circuit. Pure comedy and banter!',
    audio_length_sec: 1800, // 30 minutes
    podcast_name: 'Laugh Track',
    cover_art: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=300&h=300&fit=crop',
    external_url: 'https://example.com/episode3',
    published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-4',
    title: 'Mindful Meditation: Finding Peace in Chaos',
    description: 'A calming guide to meditation and mindfulness. Learn breathing techniques, body scans, and mental exercises to reduce anxiety and find inner peace. Perfect for stress relief and relaxation.',
    audio_length_sec: 1500, // 25 minutes
    podcast_name: 'Zen Moments',
    cover_art: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
    external_url: 'https://example.com/episode4',
    published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-5',
    title: 'Success Stories: From Startup to Millions',
    description: 'Inspiring interviews with successful entrepreneurs. Learn about their journey, failures, breakthroughs, and the resilience that drove them to build amazing companies. Full of motivation and practical advice.',
    audio_length_sec: 4200, // 70 minutes
    podcast_name: 'Business Builders',
    cover_art: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop',
    external_url: 'https://example.com/episode5',
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-6',
    title: 'Current Events: What You Need to Know This Week',
    description: 'Stay updated with the latest news, current events, and cultural happenings. Get the essential information you need to stay informed about politics, culture, and world events.',
    audio_length_sec: 2400, // 40 minutes
    podcast_name: 'Weekly Update',
    cover_art: 'https://images.unsplash.com/photo-1489599484573-4b7e1b1c9e5c?w=300&h=300&fit=crop',
    external_url: 'https://example.com/episode6',
    published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-7',
    title: 'Random Facts: Weird Trivia and Unusual Stories',
    description: 'A collection of bizarre facts, strange stories, and random trivia. Perfect background listening to kill time. From unusual historical events to weird science discoveries, this episode will entertain you.',
    audio_length_sec: 1800, // 30 minutes
    podcast_name: 'Weird World',
    cover_art: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=300&fit=crop',
    external_url: 'https://example.com/episode7',
    published_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-8',
    title: 'Deep Reflections: Life, Meaning, and Mental Health',
    description: 'A thoughtful exploration of life\'s big questions. Delve into introspective discussions about personal growth, relationships, and the human experience. Perfect for those seeking deeper understanding.',
    audio_length_sec: 3300, // 55 minutes
    podcast_name: 'Deep Thoughts',
    cover_art: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=300&fit=crop',
    external_url: 'https://example.com/episode8',
    published_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-9',
    title: 'How to Master Any Skill: Deep Dive into Learning',
    description: 'Educational content on learning methods, memory techniques, and study strategies. A comprehensive explainer on how to learn faster, retain information better, and master new skills efficiently.',
    audio_length_sec: 2100, // 35 minutes
    podcast_name: 'Learning Lab',
    cover_art: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=300&fit=crop',
    external_url: 'https://example.com/episode9',
    published_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-10',
    title: 'Moving Family Stories: True Tales That Will Make You Cry',
    description: 'Emotional true stories about family, love, and human connection. These moving narratives will touch your heart and might bring tears to your eyes. Perfect for when you want to feel deeply.',
    audio_length_sec: 2700, // 45 minutes
    podcast_name: 'Heart Stories',
    cover_art: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop',
    external_url: 'https://example.com/episode10',
    published_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export class DemoService {
  public async searchEpisodes(query: string, limit: number = 20): Promise<Episode[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simple keyword matching for demo
    const keywords = query.toLowerCase().split(' ');
    const matchedEpisodes = demoEpisodes.filter(episode => {
      const searchText = (episode.title + ' ' + episode.description + ' ' + episode.podcast_name).toLowerCase();
      return keywords.some(keyword => searchText.includes(keyword));
    });
    
    return matchedEpisodes.slice(0, limit);
  }
  
  public async getBestPodcasts(): Promise<Episode[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return demoEpisodes;
  }
}

export const demoService = new DemoService(); 