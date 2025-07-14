-- VibeCast Ratings Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create ratings table
CREATE TABLE ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  mood TEXT[] NOT NULL,
  themes TEXT[] NOT NULL,
  timestamp BIGINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ratings_episode_id ON ratings(episode_id);
CREATE INDEX idx_ratings_timestamp ON ratings(timestamp);
CREATE INDEX idx_ratings_mood ON ratings USING GIN(mood);
CREATE INDEX idx_ratings_themes ON ratings USING GIN(themes);
CREATE INDEX idx_ratings_rating ON ratings(rating);
CREATE INDEX idx_ratings_created_at ON ratings(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts
CREATE POLICY "Allow anonymous inserts" ON ratings
  FOR INSERT TO anon
  WITH CHECK (true);

-- Create policy to allow anonymous reads
CREATE POLICY "Allow anonymous reads" ON ratings
  FOR SELECT TO anon
  USING (true);

-- Create a simplified view for analytics
CREATE VIEW rating_analytics AS
SELECT 
  episode_id,
  COUNT(*) as total_ratings,
  AVG(rating) as average_rating,
  COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_ratings,
  COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_ratings
FROM ratings
GROUP BY episode_id; 