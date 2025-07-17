export const config = {
  spotify: {
    clientId: '0b957080e89f49aba057eeda72d543af',
    // NOTE: Client secret should be in backend, not frontend
    // For now, we'll use a workaround
    clientSecret: '', // This needs to be set up properly
  },
  app: {
    name: 'VibeCast 2.0',
    version: '2.0.0',
    // Frontend is currently running on port 5174
    baseUrl: process.env.NODE_ENV === 'production' 
      ? 'https://6db3bccce2d6.ngrok-free.app' 
      : 'http://localhost:5174',
  },
}; 