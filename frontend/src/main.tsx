import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { config } from './wagmiConfig'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from "@/components/theme-provider"

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <RainbowKitProvider theme={lightTheme()}>
            <App />
          </RainbowKitProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
