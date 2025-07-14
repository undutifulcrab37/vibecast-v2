# 🗄️ Supabase Setup Guide for VibeCast Ratings

## 📋 **Current State vs. Supabase**

### **Current: localStorage**
- ✅ Works immediately, no setup
- ❌ Data lost when browser cleared
- ❌ No cross-device sync
- ❌ Can't aggregate ratings from multiple users

### **With Supabase:**
- ✅ Persistent storage across devices
- ✅ Real-time rating aggregation
- ✅ Better algorithm training with more data
- ✅ User analytics and insights
- ✅ Scalable for multiple users

## 🚀 **Setup Instructions**

### **Step 1: Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### **Step 2: Install Supabase Client**
```bash
npm install @supabase/supabase-js
```

### **Step 3: Create Database Tables**

Run this SQL in your Supabase SQL editor:

```sql
-- Create ratings table
CREATE TABLE ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  mood TEXT[] NOT NULL,
  themes TEXT[] NOT NULL,
  timestamp BIGINT NOT NULL,
  comment TEXT,
  user_id UUID REFERENCES auth.users(id), -- Optional: for user authentication
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ratings_episode_id ON ratings(episode_id);
CREATE INDEX idx_ratings_timestamp ON ratings(timestamp);
CREATE INDEX idx_ratings_mood ON ratings USING GIN(mood);
CREATE INDEX idx_ratings_themes ON ratings USING GIN(themes);

-- Enable Row Level Security (RLS)
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (for now)
CREATE POLICY "Allow anonymous inserts" ON ratings
  FOR INSERT TO anon
  WITH CHECK (true);

-- Create policy to allow anonymous reads
CREATE POLICY "Allow anonymous reads" ON ratings
  FOR SELECT TO anon
  USING (true);
```

### **Step 4: Configure Environment Variables**

Create a `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Step 5: Update Rating Service**

In `src/services/ratingService.ts`, update the configuration:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class RatingService {
  private readonly USE_SUPABASE = true; // Enable Supabase
  
  // ... rest of implementation
}
```

## 📊 **Database Schema**

### **ratings table:**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| episode_id | TEXT | Podcast episode identifier |
| rating | INTEGER | 1-5 star rating |
| mood | TEXT[] | Array of user's moods |
| themes | TEXT[] | Array of user's themes |
| timestamp | BIGINT | Unix timestamp |
| comment | TEXT | Optional user comment |
| user_id | UUID | Optional user identifier |
| created_at | TIMESTAMP | Auto-generated timestamp |

## 🔧 **Implementation Benefits**

### **1. Real-time Algorithm Improvement**
- Ratings from all users improve recommendations
- Better mood/theme matching over time
- Collective intelligence for episode scoring

### **2. Analytics Dashboard Potential**
- Most popular episodes by mood
- Rating trends over time
- User satisfaction metrics

### **3. Advanced Features Possible**
- User accounts and personalized history
- Social features (see what others rated)
- Recommendation explanations based on community data

## 🚦 **Migration Strategy**

### **Phase 1: Dual Mode (Current)**
- Keep localStorage as default
- Add Supabase infrastructure
- Test with small user group

### **Phase 2: Gradual Migration**
- Enable Supabase for new users
- Migrate existing localStorage data
- Monitor performance

### **Phase 3: Full Migration**
- Switch to Supabase-only
- Remove localStorage fallback
- Add advanced features

## 💡 **Quick Start (5 minutes)**

1. **Create Supabase project** → Get URL & key
2. **Run SQL schema** → Create ratings table
3. **Install client** → `npm install @supabase/supabase-js`
4. **Update .env** → Add your credentials
5. **Flip the switch** → Set `USE_SUPABASE = true`

## 🔒 **Security Considerations**

- **Anonymous ratings**: Currently allows anyone to rate
- **Rate limiting**: Consider adding to prevent spam
- **Data validation**: Server-side validation of ratings
- **User authentication**: Optional but recommended for production

## 📈 **Cost Estimate**

- **Free tier**: 500MB database, 2GB bandwidth
- **Perfect for MVP**: Thousands of ratings
- **Scales automatically**: Pay as you grow

---

**Ready to upgrade?** The rating system is already built to support both localStorage and Supabase - just follow the setup guide above! 🚀 