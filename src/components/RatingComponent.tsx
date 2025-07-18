import React, { useState } from 'react';
import { Star, MessageCircle, Send, Sparkles, CheckCircle } from 'lucide-react';
import { ScoredEpisode, Mood, Theme, UserRating } from '../types';
import { ratingService } from '../services/ratingService';

interface RatingComponentProps {
  episode: ScoredEpisode;
  userMoods: Mood[];
  userThemes: Theme[];
  onRatingSubmitted: () => void;
}

export const RatingComponent: React.FC<RatingComponentProps> = ({
  episode,
  userMoods,
  userThemes,
  onRatingSubmitted,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [showComment, setShowComment] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleSubmit = async () => {
    if (rating === 0) return;

    const userRating: UserRating = {
      episodeId: episode.id,
      rating,
      mood: userMoods,
      themes: userThemes,
      timestamp: Date.now(),
      comment: comment.trim() || undefined,
    };

    try {
      await ratingService.saveRating(userRating);
      setIsSubmitted(true);
      onRatingSubmitted();
    } catch (error) {
      console.error('Error saving rating:', error);
      // Still show success to user - the service has localStorage fallback
    setIsSubmitted(true);
    onRatingSubmitted();
    }
  };

  const getRatingText = (rating: number): string => {
    switch (rating) {
      case 1: return 'Poor match';
      case 2: return 'Fair match';
      case 3: return 'Good match';
      case 4: return 'Great match';
      case 5: return 'Perfect match';
      default: return 'Rate this match';
    }
  };

  const getRatingColor = (rating: number): string => {
    switch (rating) {
      case 1: return 'text-red-600';
      case 2: return 'text-orange-600';
      case 3: return 'text-yellow-600';
      case 4: return 'text-green-600';
      case 5: return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-gradient-to-r from-[#e1d5ff]/80 via-[#d4c5ff]/70 to-[#c8b5ff]/80 rounded-3xl p-6 border border-[#b19cd9]/50 shadow-lg backdrop-blur-sm">
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <CheckCircle className="w-8 h-8 text-[#8b5cf6]" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Thanks for your feedback!</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your rating helps us improve future recommendations for you and others with similar preferences.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#ffc1cc] via-[#d8b4fe] via-[#a5b4fc] to-[#fef3c7] rounded-3xl p-6 border border-[#c4b5fd]/50 shadow-lg backdrop-blur-sm">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-gray-700" />
          <h3 className="text-xl font-bold text-gray-800">How was this match?</h3>
        </div>
        <p className="text-sm text-gray-700 mb-6 leading-relaxed">
          Rate how well this episode matched your mood and preferences
        </p>

        {/* Star Rating */}
        <div className="flex justify-center items-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-2 transition-all duration-200 hover:scale-110 rounded-full hover:bg-purple-200/50"
            >
              <Star
                size={32}
                className={`
                  ${star <= (hoveredRating || rating) 
                    ? 'fill-purple-500 text-purple-500' 
                    : 'text-gray-400 hover:text-purple-400'
                  }
                  transition-colors duration-200
                `}
              />
            </button>
          ))}
        </div>

        {/* Rating Text */}
        <div className="mb-6">
          <span className={`text-lg font-semibold ${getRatingColor(hoveredRating || rating)}`}>
            {getRatingText(hoveredRating || rating)}
          </span>
        </div>

        {/* Comment Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowComment(!showComment)}
            className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 transition-colors mx-auto font-medium hover:bg-purple-100/50 px-4 py-2 rounded-full border border-purple-200"
          >
            <MessageCircle size={18} />
            {showComment ? 'Hide comment' : 'Add comment (optional)'}
          </button>
        </div>

        {/* Comment Input */}
        {showComment && (
          <div className="mb-6">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about your experience..."
              className="w-full p-4 border border-purple-200 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-white/50 backdrop-blur-sm placeholder-gray-500 text-gray-700"
              rows={3}
              maxLength={200}
            />
            <div className="text-xs text-purple-600 mt-2 text-right font-medium">
              {comment.length}/200
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0}
          className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] mx-auto"
        >
          <Send size={18} />
          Submit Rating
        </button>
      </div>
    </div>
  );
}; 