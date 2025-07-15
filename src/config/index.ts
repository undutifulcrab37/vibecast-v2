const LISTEN_NOTES_API_KEY = '2d50cfeefced4635aeb7f6f93c090520';

export const config = {
  spotify: {
    clientId: '0b957080e89f49aba057eeda72d543af',
    // Current ngrok URL forwarding to port 5177
    redirectUri: 'https://a64b0c41219e.ngrok-free.app',
    scopes: 'user-read-email user-read-private user-read-playback-state user-modify-playback-state streaming',
  },
  listenNotes: {
    apiKey: LISTEN_NOTES_API_KEY,
    baseUrl: 'https://listen-api.listennotes.com/api/v2',
  },
  app: {
    name: 'Vibecast',
    version: '1.0.0',
    description: 'Find the perfect podcast for your current vibe',
  },
}; 