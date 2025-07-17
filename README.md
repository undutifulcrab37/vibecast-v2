# VibeCast 2.0 🎧

An intelligent podcast discovery app that matches your mood and themes with the perfect podcast using advanced AI-powered recommendation algorithms.

## ✨ Features

- **Mood-Based Discovery**: Select your current mood and desired themes
- **Smart Duration Matching**: Find podcasts that fit your available time
- **Advanced Scoring Algorithm**: Uses semantic similarity, category matching, and personal preferences
- **Spotify Integration**: Access millions of high-quality podcasts
- **Personal Learning**: Rates episodes and learns your preferences over time
- **Beautiful UI**: Modern, responsive design with smooth animations

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Spotify Developer Account (for podcast access)

### API Setup
1. Sign up at [Spotify for Developers](https://developer.spotify.com/)
2. Create a new app and get your Client ID and Client Secret
3. Add your Spotify credentials to the configuration

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd vibecast-v2

# Install dependencies
npm install

# Start the development server
npm run dev

# In another terminal, start the auth server
npm run server
```

The app will be available at `http://localhost:5173` (or the next available port).

## 🔧 Configuration

Update the Spotify credentials in `src/config/index.ts`:

```typescript
export const config = {
  spotify: {
    clientId: 'your_spotify_client_id',
    clientSecret: 'your_spotify_client_secret', // Set in backend
  },
  // ... other config
};
```

## 🎯 How It Works

### 1. Mood & Theme Selection
- Choose up to 2 moods that describe how you're feeling
- Select themes that represent what you want to get from the podcast
- Set your available listening time

### 2. Intelligent Matching
The VibeCast 2.0 algorithm uses:
- **Semantic Similarity**: Understands content meaning, not just keywords
- **Category Matching**: Maps your selections to relevant podcast categories
- **Personal Learning**: Adapts to your rating patterns over time
- **Quality Signals**: Prioritizes well-produced, engaging content
- **Duration Optimization**: Smart matching with flexible time preferences

### 3. Spotify Integration
- Access to millions of high-quality podcasts
- Native Spotify playback support
- Cross-platform listening options

## 🧠 Algorithm Intelligence

VibeCast 2.0 features an enhanced recommendation system:

- **Multi-Factor Scoring**: Combines semantic analysis, category relevance, quality signals, and personal fit
- **Adaptive Learning**: Learns from your ratings to improve future recommendations
- **Diversity Optimization**: Prevents repetitive suggestions while maintaining quality
- **Smart Duration Matching**: Flexible time-based filtering with context awareness

## 📱 Usage

1. **Select Your Vibe**: Choose moods and themes that match your current state
2. **Set Duration**: Use the slider to set your available listening time
3. **Get Recommendations**: The AI finds the perfect podcast match
4. **Rate & Learn**: Rate episodes to improve future recommendations
5. **Shuffle**: Get alternative suggestions with intelligent variety

## 🎵 Spotify Integration

VibeCast integrates with Spotify to provide:
- Access to millions of podcasts
- High-quality audio streaming
- Native app integration
- Cross-platform compatibility

## 🔮 Future Enhancements

- Enhanced personalization algorithms
- Social features and sharing
- Playlist creation and management
- Advanced filtering options
- Mobile app version

## 🛠️ Development

### Project Structure
```
src/
├── components/          # React components
├── services/           # API services (Spotify)
├── utils/              # Utility functions and algorithms
├── types/              # TypeScript type definitions
└── config/             # Configuration files
```

### Key Files
- `src/components/Vibecast.tsx` - Main app component
- `src/services/spotify.ts` - Spotify API integration
- `src/services/podcastService.ts` - Main podcast search service
- `src/utils/scoring.ts` - Recommendation algorithm
- `src/utils/categoryMapping.ts` - Mood/theme to category mapping

## 📄 License

MIT License - feel free to use this project for your own podcast discovery needs!

---

**VibeCast 2.0** - Discover your perfect podcast match with AI-powered recommendations 🎧✨ 