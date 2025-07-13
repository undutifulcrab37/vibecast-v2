import { useState, useEffect } from 'react';
import { Clock, Music, Shuffle, Play, ExternalLink, LogIn, LogOut, User } from 'lucide-react';
import { Mood, Theme, ScoredEpisode, Episode } from '../types';
import { rankEpisodes } from '../utils/scoring';
import { spotifyService } from '../services/spotify';
import { listenNotesService } from '../services/listenNotes';
import { demoService } from '../services/demo';

const moods: { value: Mood; label: string; color: string }[] = [
  { value: 'happy', label: '😊 Happy', color: 'bg-gradient-to-r from-yellow-200 to-orange-200 border-yellow-300 text-yellow-800' },
  { value: 'sad', label: '😢 Sad', color: 'bg-gradient-to-r from-blue-200 to-indigo-200 border-blue-300 text-blue-800' },
  { value: 'anxious', label: '😰 Anxious', color: 'bg-gradient-to-r from-red-200 to-pink-200 border-red-300 text-red-800' },
  { value: 'bored', label: '😐 Bored', color: 'bg-gradient-to-r from-gray-200 to-slate-200 border-gray-300 text-gray-800' },
  { value: 'curious', label: '🤔 Curious', color: 'bg-gradient-to-r from-purple-200 to-violet-200 border-purple-300 text-purple-800' },
  { value: 'tired', label: '😴 Tired', color: 'bg-gradient-to-r from-indigo-200 to-blue-200 border-indigo-300 text-indigo-800' },
  { value: 'focused', label: '🎯 Focused', color: 'bg-gradient-to-r from-green-200 to-emerald-200 border-green-300 text-green-800' },
  { value: 'stressed', label: '😣 Stressed', color: 'bg-gradient-to-r from-orange-200 to-red-200 border-orange-300 text-orange-800' },
  { value: 'surprise_me', label: '🎲 Surprise Me', color: 'bg-gradient-to-r from-pink-200 to-rose-200 border-pink-300 text-pink-800' },
  { value: 'dont_know', label: '🤷 Don\'t Know', color: 'bg-gradient-to-r from-slate-200 to-gray-200 border-slate-300 text-slate-800' },
];

const themes: { value: Theme; label: string; color: string }[] = [
  { value: 'laugh', label: '😂 Laugh', color: 'bg-gradient-to-r from-yellow-200 to-orange-200 border-yellow-300 text-yellow-800' },
  { value: 'cry', label: '😢 Cry', color: 'bg-gradient-to-r from-blue-200 to-indigo-200 border-blue-300 text-blue-800' },
  { value: 'learn', label: '🧠 Learn something', color: 'bg-gradient-to-r from-green-200 to-emerald-200 border-green-300 text-green-800' },
  { value: 'be_inspired', label: '🌟 Be inspired', color: 'bg-gradient-to-r from-purple-200 to-violet-200 border-purple-300 text-purple-800' },
  { value: 'escape', label: '🌀 Escape', color: 'bg-gradient-to-r from-teal-200 to-cyan-200 border-teal-300 text-teal-800' },
  { value: 'chill', label: '🧘 Chill out', color: 'bg-gradient-to-r from-indigo-200 to-blue-200 border-indigo-300 text-indigo-800' },
  { value: 'be_distracted', label: '🎧 Be distracted', color: 'bg-gradient-to-r from-pink-200 to-rose-200 border-pink-300 text-pink-800' },
  { value: 'be_shocked', label: '😲 Be shocked', color: 'bg-gradient-to-r from-red-200 to-orange-200 border-red-300 text-red-800' },
  { value: 'reflect', label: '🤔 Reflect', color: 'bg-gradient-to-r from-violet-200 to-purple-200 border-violet-300 text-violet-800' },
  { value: 'stay_updated', label: '🗞️ Stay updated', color: 'bg-gradient-to-r from-slate-200 to-gray-200 border-slate-300 text-slate-800' },
  { value: 'feel_seen', label: '🫶 Feel seen', color: 'bg-gradient-to-r from-rose-200 to-pink-200 border-rose-300 text-rose-800' },
  { value: 'kill_time', label: '⏳ Kill time', color: 'bg-gradient-to-r from-gray-200 to-slate-200 border-gray-300 text-gray-800' },
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

  useEffect(() => {
    setIsSpotifyAuthenticated(spotifyService.isAuthenticated());
    
    // Check for authentication errors in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      console.error('Spotify authentication error:', error);
      alert('Spotify authentication failed. Please try again.');
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

    if (isSpotifyAuthenticated) {
      try {
        episodes = await spotifyService.searchEpisodes(searchQuery, 20);
      } catch (error) {
        console.error('Spotify search failed:', error);
      }
    }

    if (episodes.length < 10) {
      try {
        const listenNotesEpisodes = await listenNotesService.searchEpisodes(searchQuery, 20);
        episodes = [...episodes, ...listenNotesEpisodes];
      } catch (error) {
        console.error('Listen Notes search failed:', error);
      }
    }

    if (episodes.length === 0) {
      try {
        episodes = await demoService.searchEpisodes(searchQuery, 20);
      } catch (error) {
        console.error('Demo search failed:', error);
      }
    }

    if (episodes.length === 0) {
      try {
        episodes = await demoService.getBestPodcasts();
      } catch (error) {
        console.error('Failed to fetch demo episodes:', error);
      }
    }

    return episodes;
  };

  const findMatch = async () => {
    if (selectedMoods.length === 0 && selectedThemes.length === 0) {
      alert('Please select at least one mood or theme!');
      return;
    }

    setIsLoading(true);
    setShowResults(false);

    try {
      const episodes = await fetchEpisodes();
      setAllEpisodes(episodes);

      if (episodes.length === 0) {
        alert('No episodes found. Please try different selections.');
        return;
      }

      const rankedEpisodes = rankEpisodes(episodes, selectedMoods, selectedThemes, duration);
      setMatchedEpisode(rankedEpisodes[0]);
      setShowResults(true);
    } catch (error) {
      console.error('Error finding match:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const shuffleMatch = () => {
    if (allEpisodes.length === 0) return;

    const rankedEpisodes = rankEpisodes(allEpisodes, selectedMoods, selectedThemes, duration);
    const availableEpisodes = rankedEpisodes.filter(ep => ep.id !== matchedEpisode?.id);
    
    if (availableEpisodes.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(5, availableEpisodes.length));
      setMatchedEpisode(availableEpisodes[randomIndex]);
    }
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

  const handleSpotifyLogin = () => {
    try {
      const loginUrl = spotifyService.getLoginUrl();
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
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-yellow-200 to-pink-300">
      <div className="max-w-md mx-auto min-h-screen bg-white/80 backdrop-blur-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-400 to-purple-400 px-6 py-8 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Vibecast</h1>
                <p className="text-white/80 text-sm">Find your perfect podcast</p>
              </div>
            </div>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Spotify Auth */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            {isSpotifyAuthenticated ? (
              <button
                onClick={handleSpotifyLogout}
                className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-600 transition-colors"
              >
                <LogOut size={16} />
                Logout from Spotify
              </button>
            ) : (
              <button
                onClick={handleSpotifyLogin}
                className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-600 transition-colors"
              >
                <LogIn size={16} />
                Login with Spotify
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {!showResults ? (
            <>
              {/* Mood Selection */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">How are you feeling?</h2>
                <div className="grid grid-cols-2 gap-3">
                  {moods.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => toggleMood(mood.value)}
                      disabled={!selectedMoods.includes(mood.value) && selectedMoods.length >= 2}
                      className={`
                        p-4 rounded-2xl border-2 transition-all duration-200 text-sm font-medium
                        ${selectedMoods.includes(mood.value) 
                          ? `${mood.color} border-opacity-50 shadow-lg transform scale-105` 
                          : selectedMoods.length >= 2 
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                        }
                      `}
                    >
                      {mood.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Select up to 2 moods</p>
                {selectedMoods.length >= 2 && (
                  <p className="text-xs text-orange-600 mt-1">Maximum 2 moods selected</p>
                )}
              </div>

              {/* Theme Selection */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">I want to...</h2>
                <div className="grid grid-cols-2 gap-3">
                  {themes.map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => toggleTheme(theme.value)}
                      className={`
                        p-4 rounded-2xl border-2 transition-all duration-200 text-sm font-medium
                        ${selectedThemes.includes(theme.value) 
                          ? `${theme.color} border-opacity-50 shadow-lg transform scale-105` 
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                        }
                      `}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Select any that interest you</p>
              </div>

              {/* Time Selection */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Available time</h2>
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span className="text-2xl font-bold text-purple-800">{duration} min</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="180"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full h-2 bg-white/50 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-purple-600 mt-2">
                    <span>5 min</span>
                    <span>180 min</span>
                  </div>
                </div>
              </div>

              {/* Find Match Button */}
              <button
                onClick={findMatch}
                disabled={isLoading || (selectedMoods.length === 0 && selectedThemes.length === 0)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Finding your perfect match...
                  </div>
                ) : (
                  'Find My Podcast ✨'
                )}
              </button>
            </>
          ) : (
            matchedEpisode && (
              <div className="space-y-6">
                {/* Episode Card */}
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 shadow-xl border border-gray-100">
                  <div className="flex items-start gap-4 mb-4">
                    {matchedEpisode.cover_art && (
                      <img 
                        src={matchedEpisode.cover_art} 
                        alt={matchedEpisode.title}
                        className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">
                        {matchedEpisode.title}
                      </h3>
                      <p className="text-purple-600 font-medium text-sm mb-1">
                        {matchedEpisode.podcast_name}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {formatDuration(matchedEpisode.audio_length_sec)}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {matchedEpisode.description}
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => playEpisode(matchedEpisode)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
                    >
                      <Play size={16} />
                      Play
                    </button>
                    
                    {matchedEpisode.external_url && (
                      <button
                        onClick={() => window.open(matchedEpisode.external_url, '_blank')}
                        className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                      >
                        <ExternalLink size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={shuffleMatch}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-pink-400 text-white py-4 px-6 rounded-2xl font-medium hover:from-orange-500 hover:to-pink-500 transition-colors"
                  >
                    <Shuffle size={20} />
                    Shuffle
                  </button>
                  
                  <button
                    onClick={() => setShowResults(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    New Search
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
} 