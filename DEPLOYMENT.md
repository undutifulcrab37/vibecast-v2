# 🚀 VibeCast Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click New Project
   -Import your GitHub repository
   - Vercel will automatically detect it's a Vite React app
   - Add environment variables:
     ```
     VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
     VITE_SPOTIFY_REDIRECT_URI=https://your-app.vercel.app/api/spotify-auth
     ```
   - Click "Deploy"

3**Your app will be live at**: `https://your-app-name.vercel.app`

### Option2etlify

1ld the app locally**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `dist` folder
   - Or connect your GitHub repo for automatic deployments

### Option 3: GitHub Pages

1. **Add GitHub Pages script** to `package.json`:
   ```json
  scripts":[object Object]
    predeploy":npm run build",
  deploy":gh-pages -d dist"
   }
   ```
2**Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```
3**Deploy**:
   ```bash
   npm run deploy
   ```

## Environment Variables Setup

### For Production, you'll need:1**Spotify API Credentials**:
   - `VITE_SPOTIFY_CLIENT_ID`: Your Spotify App Client ID
   - `VITE_SPOTIFY_REDIRECT_URI`: Your apps callback URL

2. **Backend Configuration** (if using separate backend):
   - `VITE_API_BASE_URL`: Your backend API URL

## Important Notes

### 🔧 **Backend Considerations**
Your app currently has a local backend server (`server.js`). For production, you have options:

1. **Deploy backend separately** (Railway, Render, Heroku)
2. **Use Vercel serverless functions** for the Spotify auth
3. **Remove backend dependency** and use client-side only

### 🎵 **Spotify API Setup**1[Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add your production domain to redirect URIs
4Copy the Client ID to your environment variables

### 📱 **Custom Domain** (Optional)
- Vercel/Netlify offer free custom domains
- Configure DNS settings
- Update Spotify redirect URIs

## Troubleshooting

### Common Issues:
1. **Build fails**: Check for syntax errors in TypeScript
2. **Environment variables not working**: Ensure they're prefixed with `VITE_`3**Spotify auth not working**: Verify redirect URIs match exactly
4. **CORS errors**: Configure proper CORS settings for your backend

### Performance Tips:
1. **Enable compression** in your hosting platform
2e CDN** for static assets
3. **Optimize images** and bundle size
4. **Enable caching** headers

## Next Steps

After deployment:
1. Test all features work in production
2. Set up monitoring (Vercel Analytics, etc.)
3. Configure custom domain if desired
4. Set up CI/CD for automatic deployments
5. Monitor performance and user feedback

---

**Need help?** Check the hosting platform's documentation or reach out for support! 