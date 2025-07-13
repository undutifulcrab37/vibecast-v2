# 🎧 Vibecast

A React app that helps users find the perfect podcast episode based on their current mood and available time.

## ✨ Features

- **Time-based filtering**: Slider to select available listening time (5-180 minutes)
- **Mood selection**: Choose from Happy, Sad, Anxious, Motivated, Curious, or Bored
- **Theme selection**: Pick interests like Thriller, Comedy, Learning, Pop Culture, or Chill Vibes
- **Smart matching algorithm**: Advanced scoring system that matches episodes to your vibe
- **Spotify integration**: Login with Spotify for personalized recommendations and playback
- **Listen Notes API**: Fallback podcast discovery service
- **Demo mode**: Works offline with sample episodes for testing
- **Mobile-first design**: Beautiful, responsive UI built with Tailwind CSS

## 🚀 Quick Start

1. **Clone and install**:
   ```bash
   npm install
   ```

2. **Set up API keys** (optional):
   - **Spotify**: Replace `YOUR_SPOTIFY_CLIENT_ID` in `src/services/spotify.ts`
   - **Listen Notes**: Replace `YOUR_LISTEN_NOTES_API_KEY` in `src/services/listenNotes.ts`

3. **Run the app**:
   ```bash
   npm run dev
   ```

## 🔧 API Setup

### Spotify API (Recommended)
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add your domain to "Redirect URIs" (e.g., `http://localhost:5173`)
4. Copy the Client ID to `src/services/spotify.ts`

### Listen Notes API (Optional)
1. Sign up at [Listen Notes](https://www.listennotes.com/api/)
2. Get your API key
3. Replace `YOUR_LISTEN_NOTES_API_KEY` in `src/services/listenNotes.ts`

**Note**: The app works without API keys using demo data!

## 🧠 How It Works

### Matching Algorithm
The app uses a sophisticated scoring system:

1. **Mood matching**: Keywords like "happy", "uplifting", "joy" boost episodes for happy moods
2. **Theme matching**: Content-specific keywords (e.g., "mystery", "crime" for thriller)
3. **Duration filtering**: Prefers episodes within your time limit
4. **Recency bonus**: Recently published episodes get extra points

### Keyword Maps
```javascript
const vibeKeywordMap = {
  happy: ['uplifting', 'joy', 'funny', 'positive', 'feel good'],
  sad: ['empathy', 'healing', 'grief', 'storytelling', 'emotions'],
  anxious: ['calm', 'soothing', 'mindfulness', 'meditation', 'relax'],
  // ... more moods
};
```

## 🎨 Design Features

- **Modern UI**: Clean, card-based layout with smooth transitions
- **Color-coded chips**: Visual feedback for mood and theme selections
- **Responsive design**: Works perfectly on mobile and desktop
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Loading states**: Smooth loading animations and feedback

## 🔄 Usage Flow

1. **Set time**: Use the slider to select how much time you have
2. **Choose mood**: Select one or more moods that match how you're feeling
3. **Pick themes**: Choose content types you're interested in
4. **Find match**: Click "Find My Vibe" to get a personalized recommendation
5. **Play or shuffle**: Play the episode or shuffle for another match

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Spotify Web API** for music integration
- **Listen Notes API** for podcast discovery

## 📱 Mobile Experience

The app is designed mobile-first with:
- Touch-friendly controls
- Optimized layouts for small screens
- Smooth animations and transitions
- Offline functionality with demo data

## 🎯 Future Enhancements

- [ ] Save favorite episodes
- [ ] Listening history
- [ ] Social sharing
- [ ] Playlist creation
- [ ] Advanced filters (genre, language, etc.)
- [ ] User feedback system

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License - feel free to use this project for your own purposes. 