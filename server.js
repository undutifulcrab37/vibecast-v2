// Simple Express server for local development
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Spotify authentication endpoint
app.post('/api/spotify-auth', async (req, res) => {
  try {
    const clientId = '0b957080e89f49aba057eeda72d543af';
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE';

    if (!clientSecret || clientSecret === 'YOUR_CLIENT_SECRET_HERE') {
      return res.status(500).json({ 
        error: 'Spotify client secret not configured',
        message: 'Please set SPOTIFY_CLIENT_SECRET environment variable'
      });
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Spotify auth failed: ${response.status}`);
    }

    const data = await response.json();
    
    res.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    });
  } catch (error) {
    console.error('Spotify auth error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🎵 Spotify Auth Server running on http://localhost:${PORT}`);
  console.log(`🔑 Make sure to set SPOTIFY_CLIENT_SECRET environment variable`);
});

export default app; 