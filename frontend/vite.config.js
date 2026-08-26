import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'AI Financial Consultant',
        short_name: 'AI Finance',
        description: 'German Financial & Tax Optimization',
        theme_color: '#0d1117',
        background_color: '#0d1117',
        display: 'standalone',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            if (id.includes('zustand')) {
              return 'vendor-state';
            }
            return 'vendor';
          }
          if (id.includes('/components/')) {
            if (id.includes('StepWelcome')) return 'step-welcome';
            if (id.includes('StepProfile')) return 'step-profile';
            if (id.includes('StepInsurance')) return 'step-insurance';
            if (id.includes('StepTax')) return 'step-tax';
            if (id.includes('StepInvestment')) return 'step-investment';
            if (id.includes('StepRetirement')) return 'step-retirement';
            if (id.includes('TaxBreakdownChart') || id.includes('RetirementGapChart') || 
                id.includes('MonteCarloChart') || id.includes('HumanCapitalMeter') || 
                id.includes('InteractiveCashFlow')) {
              return 'components-charts';
            }
            return 'components-ui';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})