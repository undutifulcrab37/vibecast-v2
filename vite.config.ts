import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow external connections
    allowedHosts: [
      'legislative-nirvana-commodities-believe.trycloudflare.com',
      'scenarios-aggressive-babies-afternoon.trycloudflare.com',
      'fuji-instruction-narrative-estimation.trycloudflare.com',
      'curvy-parrots-kiss.loca.lt',
      'localhost',
      '127.0.0.1',
      '192.168.1.105',
      '.trycloudflare.com', // Allow all cloudflare tunnel subdomains
      '.loca.lt' // Allow all localtunnel subdomains
    ]
  }
}) 