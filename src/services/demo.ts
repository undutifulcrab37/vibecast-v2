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
  // Add more episodes with different durations for better testing
  {
    id: 'demo-6',
    title: 'Quick Tech Tips: Productivity Hacks in 15 Minutes',
    description: 'Fast-paced tech tips and productivity hacks. Learn how to optimize your workflow, master keyboard shortcuts, and boost your efficiency in just 15 minutes.',
    audio_length_sec: 900, // 15 minutes
    podcast_name: 'Tech Quick',
    cover_art: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=300&h=300&fit=crop',
    external_url: 'https://example.com/episode6',
    published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-7',
    title: 'Morning Motivation: 10-Minute Energy Boost',
    description: 'Start your day right with this energizing 10-minute motivation session. Positive affirmations, goal-setting tips, and inspiring stories to fuel your morning routine.',
    audio_length_sec: 600, // 10 minutes
    podcast_name: 'Daily Boost',
    cover_art: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
    external_url: 'https://example.com/episode7',
    published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-8',
    title: 'Deep Dive: The History of Space Exploration',
    description: 'A comprehensive 90-minute journey through the history of space exploration. From the first satellites to Mars missions, explore humanity\'s greatest adventure in detail.',
    audio_length_sec: 5400, // 90 minutes
    podcast_name: 'Space Chronicles',
    cover_art: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=300&h=300&fit=crop',
    external_url: 'https://example.com/episode8',
    published_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-9',
    title: 'Lunch Break Learning: Psychology Facts',
    description: 'Perfect for your lunch break! Discover fascinating psychology facts and insights in this bite-sized 20-minute episode. Learn about human behavior, cognitive biases, and mental tricks.',
    audio_length_sec: 1200, // 20 minutes
    podcast_name: 'Mind Bites',
    cover_art: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=300&fit=crop',
    external_url: 'https://example.com/episode9',
    published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-10',
    title: 'Weekend Stories: 2-Hour True Crime Marathon',
    description: 'Settle in for a long-form true crime investigation. This 2-hour deep dive covers multiple cases, interviews with experts, and detailed analysis of criminal psychology.',
    audio_length_sec: 7200, // 120 minutes
    podcast_name: 'Crime Deep Dive',
    cover_art: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
    external_url: 'https://example.com/episode10',
    published_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
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