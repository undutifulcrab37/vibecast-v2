export const config = {
  spotify: {
    clientId: '0b957080e89f49aba057eeda72d543af',
    redirectUri: 'https://vibecast-v2-rc52j18s6-jess-projects-35aa46dd.vercel.app',
    scopes: 'user-read-email user-read-private user-read-playback-state user-modify-playback-state streaming',
  },
  listenNotes: {
    apiKey: 'YOUR_LISTEN_NOTES_API_KEY',
    baseUrl: 'https://listen-api.listennotes.com/api/v2',
  },
  app: {
    name: 'Vibecast',
    version: '1.0.0',
    description: 'Find the perfect podcast for your current vibe',
  },
}; 