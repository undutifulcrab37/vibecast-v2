# VibeCast 2.0 - Spotify Integration Setup Guide

## 🎵 What's New

VibeCast now supports **hybrid podcast search** using both Spotify and Listen Notes APIs, giving you:

- **Better rate limits** - No more monthly quota exhaustion!
- **Native Spotify playback** - Play episodes directly in your Spotify app
- **Comprehensive coverage** - Access to both Spotify's catalog AND Listen Notes' 3.6M podcasts
- **Intelligent fallback** - Automatically switches between services for best results

## 🔧 Quick Setup (Spotify Developer Dashboard)

1. **Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)**
2. **Click on your app** (`0b957080e89f49aba057eeda72d543af`)
3. **Click "Settings"**
4. **Add Redirect URI**: `http://localhost:5175`
5. **Save changes**

## 🧪 Testing the New Features

### 1. Test Without Spotify (Listen Notes Only)
1. Open VibeCast in your browser
2. Click the **🧪 Test API** button in the top-right
3. You should see Listen Notes working
4. Try a search - it will use the quota-friendly Listen Notes strategy

### 2. Test Spotify Integration
1. Click the **⚙️ Settings** button (new button next to the test button)
2. In the Service Status panel:
   - Click **"Connect Spotify"** 
   - Login with your Spotify account
   - You'll be redirected back with authentication
3. Click **"Test All"** to verify both services work
4. Try switching between providers:
   - **Hybrid** (recommended) - Uses both APIs
   - **Spotify** - Spotify-only search
   - **Listen Notes** - Traditional quota-friendly search

### 3. Test Native Playback
1. Connect to Spotify (step 2)
2. **Open Spotify app** on your device (required for playback)
3. Search for a podcast episode
4. Click **"Listen on Spotify"**
5. Episode should start playing in your Spotify app!

## 📊 Provider Comparison

| Feature | **Hybrid Mode** | **Spotify Only** | **Listen Notes Only** |
|---------|----------------|-------------------|----------------------|
| **Monthly Limits** | None from Spotify | None | 300 requests |
| **Content Coverage** | Best of both | Spotify catalog | All podcasts |
| **Authentication** | Optional | Required | None |
| **Native Playback** | Yes (if auth) | Yes | No |
| **Rate Limits** | Best | Good | Limited |

## 🎯 Recommended Usage

1. **Start with Hybrid mode** (default)
2. **Connect Spotify** for best experience
3. **Use "Test All"** if you encounter issues
4. **Switch to Listen Notes only** if you hit Spotify rate limits

## 🚀 Benefits Over Previous Version

### Before (Listen Notes only):
- ❌ 300 requests/month limit (only ~8 searches)
- ❌ Account suspended when quota exceeded
- ❌ No native playback

### Now (Hybrid approach):
- ✅ No monthly limits from Spotify
- ✅ Intelligent fallback between services  
- ✅ Native Spotify playback
- ✅ ~100+ searches per month even with Listen Notes fallback
- ✅ Better error handling and user feedback

## 🔍 How It Works

The new **Podcast Service** intelligently:

1. **Checks authentication status**
2. **Tries Spotify first** (if authenticated) - better rate limits
3. **Falls back to Listen Notes** if needed - comprehensive coverage
4. **Combines and deduplicates** results from both sources
5. **Provides detailed error messages** with actionable solutions

## 🛠️ Troubleshooting

### "No podcasts found"
- Check Service Status (⚙️ button)
- Try connecting Spotify
- Test individual services

### "Spotify authentication expired"
- Click "Connect Spotify" again
- Make sure redirect URI is set correctly

### "No active Spotify device"
- Open Spotify app on your phone/computer
- Start playing any song, then try VibeCast again

### Listen Notes quota exceeded
- Switch to Spotify-only mode
- Wait until next month for quota reset
- Consider getting a new Listen Notes API key

---

**Enjoy unlimited podcast discovery! 🎧** 