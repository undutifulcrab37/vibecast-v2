import { useState, useEffect } from 'react';
import { Shuffle, ExternalLink, User, Sparkles, ChevronDown, ChevronUp, BarChart3, TrendingUp, Settings, Music } from 'lucide-react';
import { Mood, Theme, ScoredEpisode, Episode } from '../types';
import { rankEpisodes, getRecommendationStats } from '../utils/scoring';
import { podcastService, SearchProvider } from '../services/podcastService';
import { spotifyService } from '../services/spotify';
import { urlGeneratorService } from '../services/urlGenerator';
import { RatingComponent } from './RatingComponent';
import { ratingService } from '../services/ratingService';
import vibeLogo from '../assets/images/Vibe.png';

// Service Status Component
const ServiceStatus = ({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    if (isVisible) {
      loadStatus();
    }
  }, [isVisible]);

  const loadStatus = () => {
    const currentStatus = podcastService.getProviderStatus();
    const recommendation = podcastService.getProviderRecommendation();
    setStatus({ ...currentStatus, recommendation });
  };

  const testServices = async () => {
    setLoading(true);
    try {
      const results = await podcastService.testServices();
      setTestResults(results);
    } catch (error) {
      console.error('Service test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpotifyLogin = () => {
    const loginUrl = spotifyService.getLoginUrl();
    window.location.href = loginUrl;
  };

  const handleProviderChange = (provider: SearchProvider) => {
    podcastService.setProvider(provider);
    loadStatus();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Service Status</h2>
                <p className="text-gray-600">Manage podcast search providers</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          {status && (
            <div className="space-y-6">
              {/* Current Status */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                <h3 className="font-semibold text-indigo-900 mb-3">Current Configuration</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-indigo-800">Provider:</span>
                    <span className="font-medium text-indigo-900">{status.provider}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-indigo-800">Spotify Authenticated:</span>
                    <span className={`font-medium ${status.authenticated ? 'text-green-600' : 'text-red-600'}`}>
                      {status.authenticated ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Choose Search Provider</h3>
                <div className="space-y-3">
                  {Object.values(SearchProvider).map(provider => (
                    <button
                      key={provider}
                      onClick={() => handleProviderChange(provider)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        status.provider === provider
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="font-medium capitalize">{provider.replace('_', ' ')}</div>
                      <div className="text-sm opacity-75">
                        {provider === SearchProvider.SPOTIFY && 'Spotify-only search (requires login)'}
                        {provider === SearchProvider.LISTEN_NOTES && 'Listen Notes-only search (300/month limit)'}
                        {provider === SearchProvider.HYBRID && 'Best of both worlds (recommended)'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Spotify Authentication */}
              {!status.authenticated && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                  <h3 className="font-semibold text-green-900 mb-2">🎵 Connect Spotify</h3>
                  <p className="text-sm text-green-800 mb-3">
                    Unlock better rate limits and native playback by connecting your Spotify account.
                  </p>
                  <button
                    onClick={handleSpotifyLogin}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Music className="w-4 h-4" />
                    Connect Spotify
                  </button>
                </div>
              )}

              {/* Recommendations */}
              {status.recommendation && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">💡 Recommendation</h3>
                  <p className="text-sm text-purple-800 mb-3">
                    <strong>Use {status.recommendation.recommended}:</strong> {status.recommendation.reason}
                  </p>
                </div>
              )}

              {/* Test Services */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Test Services</h3>
                  <button
                    onClick={testServices}
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                  >
                    {loading ? '🔄' : '🧪'} Test All
                  </button>
                </div>
                
                {testResults && (
                  <div className="space-y-2">
                    <div className={`p-3 rounded-lg ${testResults.spotify.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Spotify</span>
                        <span className={testResults.spotify.success ? 'text-green-600' : 'text-red-600'}>
                          {testResults.spotify.success ? '✅' : '❌'}
                        </span>
                      </div>
                      <p className="text-sm opacity-75">{testResults.spotify.message}</p>
                    </div>
                    
                    <div className={`p-3 rounded-lg ${testResults.listenNotes.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Listen Notes</span>
                        <span className={testResults.listenNotes.success ? 'text-green-600' : 'text-red-600'}>
                          {testResults.listenNotes.success ? '✅' : '❌'}
                        </span>
                      </div>
                      <p className="text-sm opacity-75">{testResults.listenNotes.message}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// User Preferences Insight Component
const PreferencesInsight = ({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) => {
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadPreferences();
    }
  }, [isVisible]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const summary = await ratingService.getUserPreferencesSummary();
      setPreferences(summary);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Preference Intelligence</h2>
                <p className="text-gray-600">How VibeCast 2.0 learns your taste</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Analyzing your preferences...</span>
            </div>
          ) : preferences ? (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{preferences.totalRatings}</div>
                  <div className="text-sm text-blue-800">Episodes Rated</div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{preferences.avgRating}</div>
                  <div className="text-sm text-green-800">Avg Rating</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{preferences.topMoodThemeCombos.length}</div>
                  <div className="text-sm text-purple-800">Learned Patterns</div>
                </div>
              </div>

              {/* Top Combinations */}
              {preferences.topMoodThemeCombos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Your Favorite Mood + Theme Combinations
                  </h3>
                  <div className="space-y-3">
                    {preferences.topMoodThemeCombos.slice(0, 5).map((combo: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="font-medium text-gray-900">{combo.combo}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{combo.episodes} episodes</span>
                          <div className="flex items-center gap-1">
                            <div 
                              className={`w-3 h-3 rounded-full ${
                                combo.weight > 0.3 ? 'bg-green-400' : 
                                combo.weight > 0 ? 'bg-yellow-400' : 'bg-red-400'
                              }`}
                            />
                            <span className="font-medium">
                              {combo.weight > 0.3 ? 'Love' : combo.weight > 0 ? 'Like' : 'Dislike'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Algorithm Insights */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-indigo-900 mb-2">🧠 How VibeCast 2.0 Enhances Your Experience:</h3>
                <ul className="text-sm text-indigo-800 space-y-1">
                  <li>• <strong>Semantic Matching:</strong> Understands content meaning, not just keywords</li>
                  <li>• <strong>Personal Learning:</strong> Adapts to your rating patterns over time</li>
                  <li>• <strong>Quality Signals:</strong> Prioritizes well-produced, engaging content</li>
                  <li>• <strong>Diversity Balance:</strong> Prevents repetitive recommendations</li>
                  <li>• <strong>Smart Duration:</strong> Flexible time matching with context awareness</li>
                </ul>
              </div>

              {preferences.totalRatings === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <Sparkles className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Start Building Your Profile</h3>
                  <p className="text-gray-600">Rate a few episodes to see your personalized insights here!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              No preference data available yet. Start rating episodes to build your profile!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Expandable Description Component
const ExpandableDescription = ({ description, maxLength = 200 }: { description: string; maxLength?: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!description || description.length <= maxLength) {
    return <p className="text-gray-600 text-sm mb-4 leading-relaxed">{description}</p>;
  }
  
  // Find a good truncation point near maxLength that ends at a word boundary
  const findTruncationPoint = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text;
    
    let truncated = text.substring(0, maxLen);
    const lastSpace = truncated.lastIndexOf(' ');
    const lastPeriod = truncated.lastIndexOf('.');
    const lastComma = truncated.lastIndexOf(',');
    
    // Use the best ending point (period > comma > space)
    const bestEnd = Math.max(lastPeriod, lastComma, lastSpace);
    
    if (bestEnd > maxLen * 0.8) { // Only use if it's not too short
      truncated = truncated.substring(0, bestEnd);
    }
    
    return truncated;
  };
  
  const truncatedText = findTruncationPoint(description, maxLength);
  
  return (
    <div className="mb-4">
      <p className="text-gray-600 text-sm leading-relaxed">
        {isExpanded ? description : `${truncatedText}...`}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 mt-2 text-sm text-[#ff6b6b] hover:text-[#ff5252] font-medium transition-colors"
      >
        {isExpanded ? (
          <>
            <ChevronUp size={16} />
            Read less
          </>
        ) : (
          <>
            <ChevronDown size={16} />
            Read more
          </>
        )}
      </button>
    </div>
  );
};

// Animated icon components
const AnimatedIcon = ({ type, className = "" }: { type: string; className?: string }) => {
  const baseClass = `inline-block ${className}`;
  
  switch (type) {
    case 'happy':
      return <div className={`${baseClass} text-lg`}>😊</div>;
    case 'sad':
      return <div className={`${baseClass} text-lg`}>😢</div>;
    case 'anxious':
      return <div className={`${baseClass} text-lg`}>😰</div>;
    case 'bored':
      return <div className={`${baseClass} text-lg`}>😑</div>;
    case 'curious':
      return <div className={`${baseClass} text-lg`}>🤔</div>;
    case 'tired':
      return <div className={`${baseClass} text-lg`}>😴</div>;
    case 'focused':
      return <div className={`${baseClass} text-lg`}>🎯</div>;
    case 'stressed':
      return <div className={`${baseClass} text-lg`}>😣</div>;
    case 'surprise':
      return <div className={`${baseClass} text-lg`}>🎲</div>;
    case 'unknown':
      return <div className={`${baseClass} text-lg`}>🤷</div>;
    case 'laugh':
      return <div className={`${baseClass} text-lg`}>😂</div>;
    case 'cry':
      return <div className={`${baseClass} text-lg`}>😭</div>;
    case 'learn':
      return <div className={`${baseClass} text-lg`}>📚</div>;
    case 'inspire':
      return <div className={`${baseClass} text-lg`}>⭐</div>;
    case 'escape':
      return <div className={`${baseClass} text-lg`}>🌀</div>;
    case 'chill':
      return <div className={`${baseClass} text-lg`}>😌</div>;
    case 'distract':
      return <div className={`${baseClass} text-lg`}>🎭</div>;
    case 'shock':
      return <div className={`${baseClass} text-lg`}>😱</div>;
    case 'reflect':
      return <div className={`${baseClass} text-lg`}>🤔</div>;
    case 'update':
      return <div className={`${baseClass} text-lg`}>📰</div>;
    case 'seen':
      return <div className={`${baseClass} text-lg`}>👁️</div>;
    case 'time':
      return <div className={`${baseClass} text-lg`}>⏰</div>;
    default:
      return <div className={`${baseClass} text-lg`}>🎵</div>;
  }
};

// Apple Podcasts icon component
const ApplePodcastsIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    className={className}
  >
    <defs>
      <linearGradient id="applePodcastsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F452FF" />
        <stop offset="100%" stopColor="#832BC1" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="12" fill="url(#applePodcastsGradient)" />
    <path 
      d="M12 4.5c-4.142 0-7.5 3.358-7.5 7.5s3.358 7.5 7.5 7.5 7.5-3.358 7.5-7.5-3.358-7.5-7.5-7.5zm0 2c3.038 0 5.5 2.462 5.5 5.5s-2.462 5.5-5.5 5.5-5.5-2.462-5.5-5.5 2.462-5.5 5.5-5.5zm0 2c-1.933 0-3.5 1.567-3.5 3.5 0 .966.393 1.84 1.025 2.475.632.635 1.509 1.025 2.475 1.025s1.843-.39 2.475-1.025c.632-.635 1.025-1.509 1.025-2.475 0-1.933-1.567-3.5-3.5-3.5zm0 1.5c1.105 0 2 .895 2 2s-.895 2-2 2-2-.895-2-2 .895-2 2-2zm0 1c-.552 0-1 .448-1 1v2c0 .552.448 1 1 1s1-.448 1-1v-2c0-.552-.448-1-1-1z" 
      fill="white"
    />
  </svg>
);

const moods: { value: Mood; label: string; color: string; iconType: string }[] = [
  { value: 'happy', label: 'Happy', color: 'bg-[#ffc954] border-[#ffb1cf] text-gray-800 hover:bg-[#ffe1c9]', iconType: 'happy' },
  { value: 'sad', label: 'Sad', color: 'bg-[#c5e4ff] border-[#c8d1fa] text-gray-800 hover:bg-[#ded3f9]', iconType: 'sad' },
  { value: 'anxious', label: 'Anxious', color: 'bg-[#fa9baf] border-[#ffb1cf] text-gray-800 hover:bg-[#f2d6ec]', iconType: 'anxious' },
  { value: 'bored', label: 'Bored', color: 'bg-[#c8d1fa] border-[#ded3f9] text-gray-800 hover:bg-[#f1f0ff]', iconType: 'bored' },
  { value: 'curious', label: 'Curious', color: 'bg-[#ded3f9] border-[#f2d6ec] text-gray-800 hover:bg-[#f1f0ff]', iconType: 'curious' },
  { value: 'tired', label: 'Tired', color: 'bg-[#f1f0ff] border-[#c8d1fa] text-gray-800 hover:bg-[#ded3f9]', iconType: 'tired' },
  { value: 'focused', label: 'Focused', color: 'bg-[#e1ffd4] border-[#c5e4ff] text-gray-800 hover:bg-[#fdfaf7]', iconType: 'focused' },
  { value: 'stressed', label: 'Stressed', color: 'bg-[#fedec0] border-[#ffe1c9] text-gray-800 hover:bg-[#fa9baf]', iconType: 'stressed' },
  { value: 'surprise_me', label: 'Surprise Me', color: 'bg-[#ffb1cf] border-[#f2d6ec] text-gray-800 hover:bg-[#ffc954]', iconType: 'surprise' },
  { value: 'dont_know', label: 'Don\'t Know', color: 'bg-[#fdfaf7] border-[#c8d1fa] text-gray-800 hover:bg-[#ffe1c9]', iconType: 'unknown' },
];

const themes: { value: Theme; label: string; color: string; iconType: string }[] = [
  { value: 'laugh', label: 'Laugh', color: 'bg-[#ffc954] border-[#ffb1cf] text-gray-800 hover:bg-[#ffe1c9]', iconType: 'laugh' },
  { value: 'cry', label: 'Cry', color: 'bg-[#c5e4ff] border-[#c8d1fa] text-gray-800 hover:bg-[#ded3f9]', iconType: 'cry' },
  { value: 'learn', label: 'Learn something', color: 'bg-[#e1ffd4] border-[#c5e4ff] text-gray-800 hover:bg-[#fdfaf7]', iconType: 'learn' },
  { value: 'be_inspired', label: 'Be inspired', color: 'bg-[#ded3f9] border-[#f2d6ec] text-gray-800 hover:bg-[#f1f0ff]', iconType: 'inspire' },
  { value: 'escape', label: 'Escape', color: 'bg-[#c5e4ff] border-[#c8d1fa] text-gray-800 hover:bg-[#ded3f9]', iconType: 'escape' },
  { value: 'chill', label: 'Chill out', color: 'bg-[#f1f0ff] border-[#c8d1fa] text-gray-800 hover:bg-[#ded3f9]', iconType: 'chill' },
  { value: 'be_distracted', label: 'Be distracted', color: 'bg-[#fa9baf] border-[#ffb1cf] text-gray-800 hover:bg-[#f2d6ec]', iconType: 'distract' },
  { value: 'be_shocked', label: 'Be shocked', color: 'bg-[#fedec0] border-[#ffe1c9] text-gray-800 hover:bg-[#fa9baf]', iconType: 'shock' },
  { value: 'reflect', label: 'Reflect', color: 'bg-[#f2d6ec] border-[#ded3f9] text-gray-800 hover:bg-[#f1f0ff]', iconType: 'reflect' },
  { value: 'stay_updated', label: 'Stay updated', color: 'bg-[#c8d1fa] border-[#ded3f9] text-gray-800 hover:bg-[#f1f0ff]', iconType: 'update' },
  { value: 'feel_seen', label: 'Feel seen', color: 'bg-[#ffb1cf] border-[#f2d6ec] text-gray-800 hover:bg-[#ffc954]', iconType: 'seen' },
  { value: 'kill_time', label: 'Kill time', color: 'bg-[#fdfaf7] border-[#c8d1fa] text-gray-800 hover:bg-[#ffe1c9]', iconType: 'time' },
];

export default function Vibecast() {
  const [duration, setDuration] = useState(45);
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [matchedEpisode, setMatchedEpisode] = useState<ScoredEpisode | null>(null);
  const [allEpisodes, setAllEpisodes] = useState<Episode[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showPreferencesInsight, setShowPreferencesInsight] = useState(false);
  const [showServiceStatus, setShowServiceStatus] = useState(false);

  // Remove Spotify authentication logic since it's no longer needed for primary search
  useEffect(() => {
    // No longer need to check Spotify authentication
  }, []);

  // Test function to diagnose API issues
  const testApiConnection = async () => {
    console.log('🧪 Starting API diagnostics...');
    
    try {
      const testResult = await podcastService.testServices();
      console.log('🧪 API Test Result:', testResult);
      
      const successCount = Object.values(testResult).filter(result => result.success).length;
      const totalServices = Object.keys(testResult).length;
      
      if (successCount > 0) {
        const serviceDetails = Object.entries(testResult)
          .map(([service, result]) => `${service}: ${result.success ? '✅' : '❌'} ${result.message}`)
          .join('\n');
        
        alert(`🧪 API Test Results (${successCount}/${totalServices} working):\n\n${serviceDetails}`);
      } else {
        const errors = Object.entries(testResult)
          .map(([service, result]) => `${service}: ${result.message}`)
          .join('\n');
        
        alert(`❌ All APIs Failed!\n\n${errors}\n\nTry connecting Spotify or check your internet connection.`);
      }
    } catch (error) {
      console.error('🧪 API test failed:', error);
      alert(`💥 API Test Failed!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for details.`);
    }
  };

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

  const fetchEpisodes = async () => {
    console.log('🔍 DEBUG: Starting intelligent episode search with new service...');
    console.log('🔍 Selected moods:', selectedMoods);
    console.log('🔍 Selected themes:', selectedThemes);
    console.log('🔍 Duration:', duration);

    try {
      // Use the new hybrid podcast service
      const episodes = await podcastService.searchEpisodes(selectedMoods, selectedThemes, duration);
      
      if (episodes.length === 0) {
        throw new Error('No podcasts found for your criteria. Try different mood/theme combinations or check your API quotas.');
      }

      // Enhance episodes with platform URLs
      const enhancedEpisodes = urlGeneratorService.enhanceEpisodesWithUrls(episodes);

      console.log(`🎉 SUCCESS: ${enhancedEpisodes.length} episodes found using intelligent search`);
      return enhancedEpisodes;

    } catch (error) {
      console.error('💥 Intelligent search failed:', error);
      throw error;
    }
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

      console.log(`Ranking ${episodes.length} episodes...`);
      console.log('First episode before ranking:', episodes[0]);
      const rankedEpisodes = await rankEpisodes(episodes, selectedMoods, selectedThemes, duration);
      console.log('First ranked episode:', rankedEpisodes[0]);
      
      if (rankedEpisodes.length === 0) {
        console.warn('No episodes after ranking');
        alert('No matching episodes found. Please try different selections.');
        return;
      }
      
      setMatchedEpisode(rankedEpisodes[0]);
      setShowResults(true);
      setShowRating(true);
    } catch (error) {
      console.error('Error in findMatch:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Something went wrong while searching for podcasts. Please check your internet connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const shuffleMatch = async () => {
    if (allEpisodes.length === 0) {
      console.warn('No episodes available for shuffling');
      return;
    }

    console.log(`🎲 Enhanced Shuffle: Starting from ${allEpisodes.length} total episodes`);
    
    // Re-rank all episodes to get fresh scoring with enhanced algorithm
    const rankedEpisodes = await rankEpisodes(allEpisodes, selectedMoods, selectedThemes, duration);
    
    if (rankedEpisodes.length === 0) {
      console.warn('No ranked episodes available for shuffling');
      return;
    }

    // Get episodes that are different from the current match
    const availableEpisodes = rankedEpisodes.filter(ep => ep.id !== matchedEpisode?.id);
    
    console.log(`🎯 Available for intelligent shuffle: ${availableEpisodes.length} episodes`);
    
    if (availableEpisodes.length > 0) {
      // ENHANCED SMART SHUFFLE ALGORITHM: Uses semantic scoring + diversity optimization
      let selectedEpisode;
      
      // Get recommendation stats for diversity considerations
      const { recentCount } = getRecommendationStats();
      const needsDiversity = recentCount > 5; // After 5 recommendations, prioritize diversity
      
      if (availableEpisodes.length <= 5) {
        // Small pool: pick best available
        selectedEpisode = availableEpisodes[0];
        console.log(`🎯 Small pool: selected top-ranked episode`);
      } else {
        // Use enhanced weighted selection based on scoring factors
        const rand = Math.random();
        
        // Adjust probabilities based on user patterns and diversity needs
        const diversityWeight = needsDiversity ? 0.4 : 0.2;
        const qualityWeight = 1 - diversityWeight;
        
        if (rand < qualityWeight * 0.5) {
          // High-quality tier: Top 5 episodes with best semantic + personal fit scores
          const topTier = availableEpisodes.slice(0, Math.min(5, availableEpisodes.length));
          selectedEpisode = topTier[Math.floor(Math.random() * topTier.length)];
          console.log(`🌟 Premium tier: selected from top 5 (score: ${selectedEpisode.score})`);
        } else if (rand < qualityWeight * 0.8) {
          // Quality tier: Top 15 episodes with good matches
          const qualityTier = availableEpisodes.slice(0, Math.min(15, availableEpisodes.length));
          selectedEpisode = qualityTier[Math.floor(Math.random() * qualityTier.length)];
          console.log(`⭐ Quality tier: selected from top 15 (score: ${selectedEpisode.score})`);
        } else if (rand < qualityWeight) {
          // Exploration tier: Top 30 for variety with quality
          const explorationTier = availableEpisodes.slice(0, Math.min(30, availableEpisodes.length));
          selectedEpisode = explorationTier[Math.floor(Math.random() * explorationTier.length)];
          console.log(`🔍 Exploration tier: selected from top 30 (score: ${selectedEpisode.score})`);
        } else {
          // Discovery tier: Beyond top 30 for maximum diversity
          const startIndex = Math.min(30, availableEpisodes.length);
          if (startIndex < availableEpisodes.length) {
            const discoveryTier = availableEpisodes.slice(startIndex);
            selectedEpisode = discoveryTier[Math.floor(Math.random() * discoveryTier.length)];
            console.log(`🚀 Discovery tier: selected rank ${startIndex + discoveryTier.indexOf(selectedEpisode) + 1} (score: ${selectedEpisode.score})`);
          } else {
            // Fallback to exploration tier
            const explorationTier = availableEpisodes.slice(0, Math.min(15, availableEpisodes.length));
            selectedEpisode = explorationTier[Math.floor(Math.random() * explorationTier.length)];
            console.log(`↩️ Fallback exploration: selected from top 15 (score: ${selectedEpisode.score})`);
          }
        }
      }
      
      if (selectedEpisode) {
        console.log(`✨ Enhanced shuffle result: "${selectedEpisode.title}"`);
        console.log(`📊 Match factors: ${selectedEpisode.matchReason}`);
        setMatchedEpisode(selectedEpisode);
        setShowRating(true);
      }
    } else {
      console.warn('No different episodes available for shuffling');
      // Enhanced fallback: Use semantic search expansion
      try {
        console.log('🔄 Expanding search with new service...');
        
        // Use the podcast service to get additional episodes
        const additionalEpisodes = await podcastService.searchEpisodes(selectedMoods, selectedThemes, duration);
        
        // Remove duplicates and combine with existing episodes
        const allCombined = [...allEpisodes, ...additionalEpisodes];
        const uniqueCombined = allCombined.filter((episode, index, self) => 
          self.findIndex(e => e.id === episode.id) === index
        );
        
        if (uniqueCombined.length > allEpisodes.length) {
          console.log(`📈 Expanded pool: ${allEpisodes.length} → ${uniqueCombined.length} episodes`);
          setAllEpisodes(uniqueCombined);
          
          const newRankedEpisodes = await rankEpisodes(uniqueCombined, selectedMoods, selectedThemes, duration);
          const newAvailableEpisodes = newRankedEpisodes.filter(ep => ep.id !== matchedEpisode?.id);
          
          if (newAvailableEpisodes.length > 0) {
            // Use smart selection from expanded pool
            const selectionIndex = Math.floor(Math.random() * Math.min(25, newAvailableEpisodes.length));
            const expandedSelection = newAvailableEpisodes[selectionIndex];
            setMatchedEpisode(expandedSelection);
            setShowRating(true);
            console.log(`🎉 Expanded pool selection: rank ${selectionIndex + 1} (score: ${expandedSelection.score})`);
          }
        } else {
          console.log('No additional unique episodes found');
        }
      } catch (error) {
        console.error('Enhanced fallback search failed:', error);
      }
    }
  };

  const handleRatingSubmitted = () => {
    setShowRating(false);
  };

  // New function to handle Listen Notes playback
  const handleListenNotesPlay = (episode: ScoredEpisode) => {
    if (episode.external_url) {
      window.open(episode.external_url, '_blank');
    }
  };

  // New function to handle Spotify playback
  const handleSpotifyPlay = (episode: ScoredEpisode) => {
    if (episode.spotify_uri && spotifyService.isAuthenticated()) {
      // Try native playback first
      spotifyService.playEpisode(episode.spotify_uri)
        .then(() => {
          console.log('✅ Episode playing on Spotify');
        })
        .catch((error) => {
          console.warn('Native playback failed, opening Spotify web player:', error);
          // Fallback to web player
          if (episode.external_url) {
            window.open(episode.external_url, '_blank');
          } else if (episode.spotify_url) {
            window.open(episode.spotify_url, '_blank');
          }
        });
    } else {
      // Open in Spotify web/app
      if (episode.external_url) {
        window.open(episode.external_url, '_blank');
      } else if (episode.spotify_url) {
        window.open(episode.spotify_url, '_blank');
      }
    }
  };

  // New function to handle Apple Podcasts playback
  const handleApplePodcastsPlay = (episode: ScoredEpisode) => {
    if (episode.apple_podcasts_url) {
      window.open(episode.apple_podcasts_url, '_blank');
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
    <div className="min-h-screen bg-gradient-to-t from-[#c5e4ff] via-[#ffe1c9] via-30% via-[#ffb1cf] via-60% to-[#ded3f9]">
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
            <div className="flex gap-2 absolute top-6 right-6">
              <button
                onClick={() => setShowPreferencesInsight(true)}
                className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 rounded-full flex items-center justify-center border border-white/50 transition-all duration-200 hover:scale-105"
                title="View Your Preference Intelligence"
              >
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </button>
              <button
                onClick={testApiConnection}
                className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 hover:from-blue-200 hover:to-cyan-200 rounded-full flex items-center justify-center border border-white/50 transition-all duration-200 hover:scale-105"
                title="Test API Connection"
              >
                <span className="text-sm">🧪</span>
              </button>
              <button
                onClick={() => setShowServiceStatus(true)}
                className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-full flex items-center justify-center border border-white/50 transition-all duration-200 hover:scale-105"
                title="Manage Search Providers"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-[#f2d6ec] to-[#ded3f9] rounded-full flex items-center justify-center border border-white/50">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {!showResults ? (
            <>
              {/* Mood Selection */}
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">How are you feeling?</h2>
                  <p className="text-gray-600 text-sm">Select up to 2 moods that describe you right now</p>
                </div>
                <div className="bg-gradient-to-br from-[#ffb1cf] from-10% via-[#fffacd] via-65% to-[#c5e4ff] rounded-3xl p-5 border border-[#ffb1cf]/70 backdrop-blur-sm shadow-lg">
                <div className="grid grid-cols-2 gap-3">
                  {moods.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => toggleMood(mood.value)}
                      disabled={!selectedMoods.includes(mood.value) && selectedMoods.length >= 2}
                      className={`
                          p-3 rounded-2xl border-2 transition-all duration-300 text-sm font-semibold backdrop-blur-sm
                        ${selectedMoods.includes(mood.value) 
                            ? 'border-[#ffb1cf] bg-[#ffb1cf]/30 shadow-lg transform scale-105 ring-4 ring-[#f2d6ec]/40' 
                          : selectedMoods.length >= 2 
                              ? 'border-[#c8d1fa] text-gray-400 cursor-not-allowed bg-[#fdfaf7]/50' 
                              : 'border-[#c8d1fa] text-gray-700 hover:border-[#ffb1cf] hover:bg-[#f2d6ec]/30 transform hover:scale-[1.02] hover:shadow-md bg-[#fdfaf7]/80'
                        }
                      `}
                    >
                        <div className="flex items-center justify-center gap-2">
                          <AnimatedIcon type={mood.iconType} />
                          <span>{mood.label}</span>
                        </div>
                    </button>
                  ))}
                </div>
                {selectedMoods.length >= 2 && (
                    <p className="text-xs text-[#fa9baf] text-center font-medium mt-3">Maximum 2 moods selected</p>
                )}
                </div>
              </div>

              {/* Theme Selection */}
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">I want to...</h2>
                  <p className="text-gray-600 text-sm">Choose what you're hoping to get from this podcast</p>
                </div>
                <div className="bg-gradient-to-br from-[#ded3f9] from-25% via-[#ffb1cf] via-45% to-[#c5e4ff] rounded-3xl p-5 border border-[#ffb1cf]/70 backdrop-blur-sm shadow-lg">
                <div className="grid grid-cols-2 gap-3">
                  {themes.map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => toggleTheme(theme.value)}
                      className={`
                          p-3 rounded-2xl border-2 transition-all duration-300 text-sm font-semibold backdrop-blur-sm
                        ${selectedThemes.includes(theme.value) 
                            ? 'border-[#ffb1cf] bg-[#ffb1cf]/30 shadow-lg transform scale-105 ring-4 ring-[#ded3f9]/40' 
                            : 'border-[#c8d1fa] text-gray-700 hover:border-[#ffb1cf] hover:bg-[#ded3f9]/30 transform hover:scale-[1.02] hover:shadow-md bg-[#fdfaf7]/80'
                        }
                      `}
                    >
                        <div className="flex items-center justify-center gap-2">
                          <AnimatedIcon type={theme.iconType} />
                          <span>{theme.label}</span>
                        </div>
                    </button>
                  ))}
                  </div>
                </div>
              </div>

              {/* Time Selection */}
              <div className="space-y-3">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Available time</h2>
                  <p className="text-gray-600 text-sm">How long do you want to listen?</p>
                  </div>
                <div className="bg-gradient-to-br from-[#ffb1cf] from-10% via-[#fffacd] via-65% to-[#c5e4ff] rounded-3xl p-3 border border-[#ffb1cf]/70 backdrop-blur-sm shadow-lg">
                  <div className="relative">
                  <input
                    type="range"
                    min="5"
                    max="180"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full h-3 bg-[#fdfaf7]/70 rounded-full appearance-none cursor-pointer slider relative z-10 opacity-0"
                    />
                    <div className="absolute top-0 left-0 w-full h-3 bg-[#fdfaf7]/70 rounded-full pointer-events-none" />
                    <div 
                      className="absolute top-0 left-0 h-3 bg-gradient-to-r from-[#ffb1cf] to-[#fa9baf] rounded-full pointer-events-none"
                      style={{ width: `${((duration - 5) / (180 - 5)) * 100}%` }}
                    />
                    <div 
                      className="absolute top-[-3px] w-5 h-5 bg-gradient-to-br from-[#ffb1cf] to-[#fa9baf] rounded-full pointer-events-none shadow-lg border-2 border-white"
                      style={{ left: `calc(${((duration - 5) / (180 - 5)) * 100}% - 10px)` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2 font-medium">
                    <span className="text-xs text-gray-600">5 min</span>
                    <span className="text-2xl font-bold text-gray-800">{duration} min</span>
                    <span className="text-xs text-gray-600">180 min</span>
                  </div>
                </div>
              </div>
              
              {/* Find Match Button */}
              <button
                onClick={findMatch}
                disabled={isLoading || (selectedMoods.length === 0 && selectedThemes.length === 0)}
                className="w-full bg-gradient-to-r from-purple-500 via-purple-400 to-pink-400 py-6 px-8 rounded-full font-bold text-xl hover:from-purple-600 hover:via-purple-500 hover:to-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.05] shadow-2xl hover:shadow-3xl border-2 border-white/30 relative overflow-hidden group"
              >
                {/* Shine/Gleam Effect */}
                <div className="absolute inset-0 -left-2 -right-2 bg-gradient-to-b from-transparent via-white/40 via-40% via-white/20 via-60% to-transparent h-12 -skew-y-8 animate-shine pointer-events-none"></div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3 relative z-10">
                    <div className="w-7 h-7 border-3 border-[#000000] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-lg font-bold" style={{ color: '#000000', textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}>Finding your perfect match...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 relative z-10">
                    <span className="text-xl">🎧</span>
                    <span className="font-bold" style={{ color: '#000000', textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}>Find My Podcast</span>
                  </div>
                )}
              </button>
            </>
          ) : (
            matchedEpisode && (
              <div className="space-y-6">
                {/* Episode Card */}
                <div className="bg-gradient-to-br from-[#fdfaf7]/95 via-[#fff5f0]/90 to-[#ffe4e1]/85 backdrop-blur-sm rounded-3xl p-6 border border-[#ff7f7f]/30 shadow-lg">
                  <div className="flex items-start gap-4 mb-4">
                    {matchedEpisode.cover_art && (
                      <img 
                        src={matchedEpisode.cover_art} 
                        alt={matchedEpisode.title || 'Episode cover'}
                        className="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-[#ff9999]/40"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-800 mb-2 leading-tight">
                        {matchedEpisode.title || 'Untitled Episode'}
                      </h3>
                      <p className="text-[#ff6b6b] font-semibold text-sm mb-1">
                        {matchedEpisode.podcast_name || 'Unknown Podcast'}
                      </p>
                      <p className="text-gray-500 text-sm font-medium">
                        {formatDuration(matchedEpisode.audio_length_sec || 0)}
                      </p>
                    </div>
                  </div>
                  
                  <ExpandableDescription description={matchedEpisode.description || 'No description available'} />
                  
                  {/* Enhanced Algorithm Intelligence Display */}
                  <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-2xl p-4 mb-4 border border-indigo-200/50 backdrop-blur-sm">
                    <h4 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      VibeCast 2.0 Intelligence Match
                    </h4>
                    
                    {/* Match Score */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-indigo-800 font-medium">Match Quality:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-indigo-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (matchedEpisode.score / 100) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-indigo-700">
                          {Math.round((matchedEpisode.score / 100) * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Match Reasons */}
                    {matchedEpisode.matchReason && (
                      <div className="text-xs text-indigo-700 leading-relaxed">
                        <strong>Why this matches:</strong> {matchedEpisode.matchReason}
                      </div>
                    )}
                  </div>
                  
                  {/* Display the filters used */}
                  <div className="bg-gradient-to-r from-[#ffcccb]/70 via-[#ffd7d7]/60 to-[#ffe4e1]/70 rounded-2xl p-4 mb-4 border border-[#ff9999]/50 backdrop-blur-sm">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-4 h-4 text-[#ff6b6b]">🎯</span>
                      Your Search Criteria:
                    </h4>
                    <div className="space-y-3">
                      {/* Mood filters */}
                      {selectedMoods.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-gray-600 font-medium">Mood:</span>
                          {selectedMoods.map(mood => {
                            const moodConfig = moods.find(m => m.value === mood);
                            return (
                              <span key={mood} className="text-xs px-3 py-1 rounded-full font-medium bg-[#fff5f0]/90 border border-[#ffb3b3] text-[#ff4757]">
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
                              <span key={theme} className="text-xs px-3 py-1 rounded-full font-medium bg-[#fff0f0]/90 border border-[#ffa8a8] text-[#ff6b6b]">
                                {themeConfig?.label || theme}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Duration filter */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 font-medium">Duration:</span>
                        <span className="text-xs px-3 py-1 rounded-full bg-[#ffe8e8]/90 border border-[#ff9d9d] text-[#ff5252] font-medium">
                          {duration} minutes
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* New listening options */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Choose where to listen:</h4>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {/* Spotify Button */}
                      <button
                        onClick={() => handleSpotifyPlay(matchedEpisode)}
                        className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-full font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.42.179-.78.54-.84 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.242 1.081zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                        <span>Listen on Spotify</span>
                      </button>

                      {/* Apple Podcasts Button */}
                      <button
                        onClick={() => handleApplePodcastsPlay(matchedEpisode)}
                        className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-full font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                      >
                        <ApplePodcastsIcon size={20} />
                        <span>Listen on Apple Podcasts</span>
                      </button>

                      {/* Listen Notes Button */}
                      <button
                        onClick={() => handleListenNotesPlay(matchedEpisode)}
                        className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-full font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                      >
                        <ExternalLink size={18} />
                        <span>Listen Elsewhere</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={shuffleMatch}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#ff6b6b] to-[#ff8e8e] text-white py-4 px-6 rounded-full font-semibold hover:from-[#ff5252] hover:to-[#ff7575] transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                  >
                    <Shuffle size={20} />
                    Shuffle
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowResults(false);
                      setShowRating(false);
                      setSelectedMoods([]);
                      setSelectedThemes([]);
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

        {/* Footer - Listen Notes Attribution */}
        <div className="text-center p-6 border-t border-[#c8d1fa]/50 bg-[#fdfaf7]/80 backdrop-blur-sm">
          <p className="text-sm text-gray-600">Discover podcasts powered by Listen Notes</p>
          <p className="text-xs text-gray-500 mt-1">Listen on your favorite platform</p>
        </div>
      </div>
      {showPreferencesInsight && (
        <PreferencesInsight
          isVisible={showPreferencesInsight}
          onClose={() => setShowPreferencesInsight(false)}
        />
      )}
      {showServiceStatus && (
        <ServiceStatus
          isVisible={showServiceStatus}
          onClose={() => setShowServiceStatus(false)}
        />
      )}
    </div>
  );
} 