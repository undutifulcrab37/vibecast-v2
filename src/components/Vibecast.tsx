import { useState, useEffect } from 'react';
import { Clock, Music, Shuffle, Play, ExternalLink, LogIn, LogOut, User, Sparkles } from 'lucide-react';
import { Mood, Theme, ScoredEpisode, Episode } from '../types';
import { rankEpisodes } from '../utils/scoring';
import { spotifyService } from '../services/spotify';
import { listenNotesService } from '../services/listenNotes';
import { demoService } from '../services/demo';
import { RatingComponent } from './RatingComponent';
import vibeLogo from '../assets/images/Vibe.png';

const moods: { value: Mood; label: string; color: string }[] = [
  { value: 'happy', label: '�� Happy', color: 'bg-[#ffc954] border-[#ffb1cf] text-gray-800 hover:bg-[#ffe1c9]' },
  { value: 'sad', label: '😢 Sad', color: 'bg-[#c5e4ff] border-[#c8d1fa] text-gray-800 hover:bg-[#ded3f9]' },
  { value: 'anxious', label: '😰 Anxious', color: 'bg-[#fa9baf] border-[#ffb1cf] text-gray-800 hover:bg-[#f2d6ec]' },
  { value: 'bored', label: '😐 Bored', color: 'bg-[#c8d1fa] border-[#ded3f9] text-gray-800 hover:bg-[#f1f0ff]' },
  { value: 'curious', label: '🤔 Curious', color: 'bg-[#ded3f9] border-[#f2d6ec] text-gray-800 hover:bg-[#f1f0ff]' },
  { value: 'tired', label: '😴 Tired', color: 'bg-[#f1f0ff] border-[#c8d1fa] text-gray-800 hover:bg-[#ded3f9]' },
  { value: 'focused', label: '🎯 Focused', color: 'bg-[#e1ffd4] border-[#c5e4ff] text-gray-800 hover:bg-[#fdfaf7]' },
  { value: 'stressed', label: '😣 Stressed', color: 'bg-[#fedec0] border-[#ffe1c9] text-gray-800 hover:bg-[#fa9baf]' },
  { value: 'surprise_me', label: '🎲 Surprise Me', color: 'bg-[#ffb1cf] border-[#f2d6ec] text-gray-800 hover:bg-[#ffc954]' },
  { value: 'dont_know', label: '🤷 Don\'t Know', color: 'bg-[#fdfaf7] border-[#c8d1fa] text-gray-800 hover:bg-[#ffe1c9]' },
];

const themes: { value: Theme; label: string; color: string }[] = [
  { value: 'laugh', label: '😂 Laugh', color: 'bg-[#ffc954] border-[#ffb1cf] text-gray-800 hover:bg-[#ffe1c9]' },
  { value: 'cry', label: '😢 Cry', color: 'bg-[#c5e4ff] border-[#c8d1fa] text-gray-800 hover:bg-[#ded3f9]' },
  { value: 'learn', label: '🧠 Learn something', color: 'bg-[#e1ffd4] border-[#c5e4ff] text-gray-800 hover:bg-[#fdfaf7]' },
  { value: 'be_inspired', label: '🌟 Be inspired', color: 'bg-[#ded3f9] border-[#f2d6ec] text-gray-800 hover:bg-[#f1f0ff]' },
  { value: 'escape', label: '🌀 Escape', color: 'bg-[#c5e4ff] border-[#c8d1fa] text-gray-800 hover:bg-[#ded3f9]' },
  { value: 'chill', label: '🧘 Chill out', color: 'bg-[#f1f0ff] border-[#c8d1fa] text-gray-800 hover:bg-[#ded3f9]' },
  { value: 'be_distracted', label: '🎧 Be distracted', color: 'bg-[#fa9baf] border-[#ffb1cf] text-gray-800 hover:bg-[#f2d6ec]' },
  { value: 'be_shocked', label: '😲 Be shocked', color: 'bg-[#fedec0] border-[#ffe1c9] text-gray-800 hover:bg-[#fa9baf]' },
  { value: 'reflect', label: '🤔 Reflect', color: 'bg-[#f2d6ec] border-[#ded3f9] text-gray-800 hover:bg-[#f1f0ff]' },
  { value: 'stay_updated', label: '🗞️ Stay updated', color: 'bg-[#c8d1fa] border-[#ded3f9] text-gray-800 hover:bg-[#f1f0ff]' },
  { value: 'feel_seen', label: '🫶 Feel seen', color: 'bg-[#ffb1cf] border-[#f2d6ec] text-gray-800 hover:bg-[#ffc954]' },
  { value: 'kill_time', label: '⏳ Kill time', color: 'bg-[#fdfaf7] border-[#c8d1fa] text-gray-800 hover:bg-[#ffe1c9]' },
];

export default function Vibecast() {
  const [duration, setDuration] = useState(45);
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [matchedEpisode, setMatchedEpisode] = useState<ScoredEpisode | null>(null);
  const [allEpisodes, setAllEpisodes] = useState<Episode[]>([]);
  const [isSpotifyAuthenticated, setIsSpotifyAuthenticated] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    console.log('Component mounted, checking Spotify authentication...');
    const isAuth = spotifyService.isAuthenticated();
    console.log('Spotify authentication status:', isAuth);
    setIsSpotifyAuthenticated(isAuth);
    
    // Check for authentication errors in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const code = urlParams.get('code');
    
    if (error) {
      console.error('Spotify authentication error:', error);
      alert('Spotify authentication failed. Please try again.');
    }
    
    if (code) {
      console.log('Spotify authorization code found:', code);
      // The SpotifyService constructor should handle this automatically
    }
  }, []);

  const toggleMood = (mood: Mood) => {
    setSelectedMoods(prev => {
      if (prev.includes(mood)) {
        return prev.filter(m => m !== mood);
      } else {
        if (prev.length < 2) {
          return [...prev, mood];
        }
        return prev;
      }
    });
  };

  const toggleTheme = (theme: Theme) => {
    setSelectedThemes(prev => 
      prev.includes(theme) 
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    );
  };

  const buildSearchQuery = () => {
    const moodTerms = selectedMoods.join(' ');
    const themeTerms = selectedThemes.join(' ');
    return `${moodTerms} ${themeTerms} podcast`.trim();
  };

  const fetchEpisodes = async () => {
    const searchQuery = buildSearchQuery();
    let episodes: Episode[] = [];

    console.log('Starting episode search with query:', searchQuery);

    if (isSpotifyAuthenticated) {
      try {
        console.log('Searching Spotify...');
        const spotifyEpisodes = await spotifyService.searchEpisodes(searchQuery, 50); // Increased from 20
        episodes = [...episodes, ...spotifyEpisodes];
        console.log(`Found ${spotifyEpisodes.length} Spotify episodes`);
      } catch (error) {
        console.error('Spotify search failed:', error);
      }
    } else {
      console.log('Skipping Spotify search - not authenticated');
    }

    if (episodes.length < 20) { // Increased threshold
      try {
        console.log('Searching Listen Notes...');
        const listenNotesEpisodes = await listenNotesService.searchEpisodes(searchQuery, 50); // Increased from 20
        episodes = [...episodes, ...listenNotesEpisodes];
        console.log(`Found ${listenNotesEpisodes.length} Listen Notes episodes`);
      } catch (error) {
        console.error('Listen Notes search failed:', error);
      }
    } else {
      console.log('Skipping Listen Notes search - enough episodes found');
    }

    if (episodes.length === 0) {
      try {
        console.log('Searching demo episodes...');
        const demoEpisodes = await demoService.searchEpisodes(searchQuery, 50); // Increased from 20
        episodes = [...episodes, ...demoEpisodes];
        console.log(`Found ${demoEpisodes.length} demo episodes`);
      } catch (error) {
        console.error('Demo search failed:', error);
      }
    }

    if (episodes.length === 0) {
      try {
        console.log('Fetching best podcasts as fallback...');
        const bestPodcasts = await demoService.getBestPodcasts();
        episodes = [...episodes, ...bestPodcasts];
        console.log(`Found ${bestPodcasts.length} best podcasts`);
      } catch (error) {
        console.error('Failed to fetch demo episodes:', error);
      }
    }

    console.log(`Total episodes found: ${episodes.length}`);
    return episodes;
  };

  const findMatch = async () => {
    if (selectedMoods.length === 0 && selectedThemes.length === 0) {
      alert('Please select at least one mood or theme!');
      return;
    }

    setIsLoading(true);
    setShowResults(false);
    setShowRating(false);

    try {
      console.log('Starting podcast search...');
      const episodes = await fetchEpisodes();
      setAllEpisodes(episodes);

      if (episodes.length === 0) {
        console.warn('No episodes found after all search attempts');
        alert('No episodes found. Please try different selections or check your internet connection.');
        return;
      }

      console.log(`Ranking ${episodes.length} episodes...`);
      const rankedEpisodes = await rankEpisodes(episodes, selectedMoods, selectedThemes, duration);
      
      if (rankedEpisodes.length === 0) {
        console.warn('No episodes after ranking');
        alert('No matching episodes found. Please try different selections.');
        return;
      }
      
      console.log('Found best match:', rankedEpisodes[0]);
      console.log('Best match source:', rankedEpisodes[0].spotify_uri ? 'Spotify' : 'Demo/Listen Notes');
      setMatchedEpisode(rankedEpisodes[0]);
      setShowResults(true);
      setShowRating(true);
    } catch (error) {
      console.error('Error in findMatch:', error);
      alert('Something went wrong while searching for podcasts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const shuffleMatch = async () => {
    if (allEpisodes.length === 0) return;

    const rankedEpisodes = await rankEpisodes(allEpisodes, selectedMoods, selectedThemes, duration);
    const availableEpisodes = rankedEpisodes.filter(ep => ep.id !== matchedEpisode?.id);
    
    if (availableEpisodes.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(5, availableEpisodes.length));
      setMatchedEpisode(availableEpisodes[randomIndex]);
      setShowRating(true);
    }
  };

  const handleRatingSubmitted = () => {
    setShowRating(false);
  };

  const playEpisode = async (episode: ScoredEpisode) => {
    if (episode.spotify_uri && isSpotifyAuthenticated) {
      try {
        await spotifyService.playEpisode(episode.spotify_uri);
      } catch (error) {
        console.error('Error playing episode:', error);
        if (episode.external_url) {
          window.open(episode.external_url, '_blank');
        }
      }
    } else if (episode.external_url) {
      window.open(episode.external_url, '_blank');
    }
  };

  const handleSpotifyLogin = async () => {
    console.log('Spotify login button clicked!');
    
    try {
      const loginUrl = await spotifyService.getLoginUrl();
      console.log('Redirecting to Spotify login:', loginUrl);
      window.location.href = loginUrl;
    } catch (error) {
      console.error('Error generating Spotify login URL:', error);
      alert('Failed to generate Spotify login URL. Please check the configuration.');
    }
  };

  const handleSpotifyLogout = () => {
    try {
      spotifyService.logout();
      setIsSpotifyAuthenticated(false);
      console.log('Successfully logged out from Spotify');
    } catch (error) {
      console.error('Error logging out from Spotify:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#c5e4ff] via-[#ffe1c9] via-30% via-[#ffb1cf] via-60% to-[#ded3f9]">
      <div className="max-w-md mx-auto min-h-screen">
        {/* Header */}
        <div className="bg-[#fdfaf7]/98 backdrop-blur-md px-6 py-6 border-b border-[#c8d1fa]/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center justify-center w-full">
              <img 
                src={vibeLogo} 
                alt="Vibecast Logo" 
                className="h-48 w-auto object-contain max-w-full"
              />
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-[#f2d6ec] to-[#ded3f9] rounded-full flex items-center justify-center absolute top-6 right-6 border border-white/50">
              <User className="w-5 h-5 text-gray-600" />
            </div>
          </div>

          {/* Spotify Auth */}
          {isSpotifyAuthenticated ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.42.179-.78.54-.84 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.242 1.081zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Connected to Spotify</p>
                  <p className="text-xs text-gray-500">Premium podcast playback enabled</p>
                </div>
              </div>
              <button
                onClick={handleSpotifyLogout}
                className="flex items-center gap-2 bg-gradient-to-r from-[#fa9baf] to-[#ffb1cf] text-white px-4 py-2 rounded-full font-medium hover:from-[#f2d6ec] hover:to-[#fa9baf] transition-all duration-200 transform hover:scale-[1.02] text-sm"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleSpotifyLogin}
              className="mx-auto block group relative overflow-hidden bg-gradient-to-r from-green-400 to-green-500 text-white py-3 px-8 rounded-full font-semibold hover:from-green-500 hover:to-green-600 transition-all duration-300 transform hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-300 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.42.179-.78.54-.84 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.242 1.081zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                <span className="text-base">Connect with Spotify</span>
              </div>
            </button>
          )}
        </div>

        <div className="p-6 space-y-8">
          {!showResults ? (
            <>
              {/* Mood Selection */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">How are you feeling?</h2>
                  <p className="text-gray-600 text-sm">Select up to 2 moods that describe you right now</p>
                </div>
                <div className="bg-gradient-to-br from-[#f2d6ec]/80 via-[#ded3f9]/80 to-[#c5e4ff]/80 rounded-3xl p-6 border border-white/50 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-4">
                    {moods.map((mood) => (
                      <button
                        key={mood.value}
                        onClick={() => toggleMood(mood.value)}
                        disabled={!selectedMoods.includes(mood.value) && selectedMoods.length >= 2}
                        className={`
                          p-4 rounded-2xl border-2 transition-all duration-300 text-sm font-medium backdrop-blur-sm
                          ${selectedMoods.includes(mood.value) 
                            ? 'border-[#ffb1cf] bg-[#ffb1cf]/30 shadow-lg transform scale-105 ring-4 ring-[#f2d6ec]/40' 
                            : selectedMoods.length >= 2 
                              ? 'border-[#c8d1fa] text-gray-400 cursor-not-allowed bg-[#fdfaf7]/50' 
                              : 'border-[#c8d1fa] text-gray-700 hover:border-[#ffb1cf] hover:bg-[#f2d6ec]/30 transform hover:scale-[1.02] hover:shadow-md bg-[#fdfaf7]/80'
                          }
                        `}
                      >
                        {mood.label}
                      </button>
                    ))}
                  </div>
                  {selectedMoods.length >= 2 && (
                    <p className="text-xs text-[#fa9baf] text-center font-medium mt-4">Maximum 2 moods selected</p>
                  )}
                </div>
              </div>

              {/* Theme Selection */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">I want to...</h2>
                  <p className="text-gray-600 text-sm">Choose what you're hoping to get from this podcast</p>
                </div>
                <div className="bg-gradient-to-br from-[#ded3f9]/80 via-[#c5e4ff]/80 to-[#f2d6ec]/80 rounded-3xl p-6 border border-white/50 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-4">
                    {themes.map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => toggleTheme(theme.value)}
                        className={`
                          p-4 rounded-2xl border-2 transition-all duration-300 text-sm font-medium backdrop-blur-sm
                          ${selectedThemes.includes(theme.value) 
                            ? 'border-[#ffb1cf] bg-[#ffb1cf]/30 shadow-lg transform scale-105 ring-4 ring-[#ded3f9]/40' 
                            : 'border-[#c8d1fa] text-gray-700 hover:border-[#ffb1cf] hover:bg-[#ded3f9]/30 transform hover:scale-[1.02] hover:shadow-md bg-[#fdfaf7]/80'
                          }
                        `}
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Time Selection */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Available time</h2>
                  <p className="text-gray-600 text-sm">How long do you want to listen?</p>
                </div>
                <div className="bg-gradient-to-br from-[#c5e4ff]/80 via-[#f2d6ec]/80 to-[#ded3f9]/80 rounded-3xl p-6 border border-white/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <Clock className="w-6 h-6 text-[#ded3f9]" />
                    <span className="text-3xl font-bold text-gray-800">{duration} min</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="180"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full h-3 bg-[#fdfaf7]/70 rounded-full appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-3 font-medium">
                    <span>5 min</span>
                    <span>180 min</span>
                  </div>
                </div>
              </div>

              {/* Find Match Button */}
              <button
                onClick={findMatch}
                disabled={isLoading || (selectedMoods.length === 0 && selectedThemes.length === 0)}
                className="w-full bg-gradient-to-r from-[#fa9baf] to-[#ffb1cf] text-white py-5 px-6 rounded-full font-bold text-lg hover:from-[#ffb1cf] hover:to-[#ffc954] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Finding your perfect match...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Find My Podcast
                  </div>
                )}
              </button>
            </>
          ) : (
            matchedEpisode && (
              <div className="space-y-6">
                {/* Episode Card */}
                <div className="bg-[#fdfaf7]/95 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-lg">
                  <div className="flex items-start gap-4 mb-4">
                    {matchedEpisode.cover_art && (
                      <img 
                        src={matchedEpisode.cover_art} 
                        alt={matchedEpisode.title}
                        className="w-24 h-24 rounded-2xl object-cover shadow-md"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-800 mb-2 line-clamp-2 leading-tight">
                        {matchedEpisode.title}
                      </h3>
                      <p className="text-[#ded3f9] font-semibold text-sm mb-1">
                        {matchedEpisode.podcast_name}
                      </p>
                      <p className="text-gray-500 text-sm font-medium">
                        {formatDuration(matchedEpisode.audio_length_sec)}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {matchedEpisode.description}
                  </p>
                  
                  {/* Display the filters used */}
                  <div className="bg-gradient-to-r from-[#f2d6ec]/70 to-[#ded3f9]/70 rounded-2xl p-4 mb-4 border border-white/50 backdrop-blur-sm">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#ded3f9]" />
                      Matched your preferences:
                    </h4>
                    <div className="space-y-3">
                      {/* Mood filters */}
                      {selectedMoods.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-gray-600 font-medium">Mood:</span>
                          {selectedMoods.map(mood => {
                            const moodConfig = moods.find(m => m.value === mood);
                            return (
                              <span key={mood} className="text-xs px-3 py-1 rounded-full font-medium bg-[#fdfaf7]/90 border border-[#f2d6ec] text-[#fa9baf]">
                                {moodConfig?.label || mood}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Theme filters */}
                      {selectedThemes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-gray-600 font-medium">Themes:</span>
                          {selectedThemes.map(theme => {
                            const themeConfig = themes.find(t => t.value === theme);
                            return (
                              <span key={theme} className="text-xs px-3 py-1 rounded-full font-medium bg-[#fdfaf7]/90 border border-[#ded3f9] text-[#ded3f9]">
                                {themeConfig?.label || theme}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Duration filter */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 font-medium">Duration:</span>
                        <span className="text-xs px-3 py-1 rounded-full bg-[#fdfaf7]/90 border border-[#c5e4ff] text-[#c5e4ff] font-medium">
                          {duration} minutes
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => playEpisode(matchedEpisode)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#fa9baf] to-[#ffb1cf] text-white py-3 px-4 rounded-full font-semibold hover:from-[#ffb1cf] hover:to-[#ffc954] transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                    >
                      <Play size={18} />
                      Play Now
                    </button>
                    
                    {matchedEpisode.external_url && (
                      <button
                        onClick={() => window.open(matchedEpisode.external_url, '_blank')}
                        className="flex items-center justify-center gap-2 bg-[#fdfaf7]/90 backdrop-blur-sm text-gray-700 py-3 px-4 rounded-full font-semibold hover:bg-[#fdfaf7] transition-all duration-200 transform hover:scale-[1.02] border border-[#c8d1fa]"
                      >
                        <ExternalLink size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={shuffleMatch}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#ded3f9] to-[#c5e4ff] text-white py-4 px-6 rounded-full font-semibold hover:from-[#c5e4ff] hover:to-[#f1f0ff] transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                  >
                    <Shuffle size={20} />
                    Shuffle
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowResults(false);
                      setShowRating(false);
                    }}
                    className="flex-1 bg-[#fdfaf7]/90 backdrop-blur-sm text-gray-700 py-4 px-6 rounded-full font-semibold hover:bg-[#fdfaf7] transition-all duration-200 transform hover:scale-[1.02] border border-[#c8d1fa]"
                  >
                    New Search
                  </button>
                </div>

                {/* Rating Component */}
                {showRating && matchedEpisode && (
                  <RatingComponent
                    episode={matchedEpisode}
                    userMoods={selectedMoods}
                    userThemes={selectedThemes}
                    onRatingSubmitted={handleRatingSubmitted}
                  />
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
} 