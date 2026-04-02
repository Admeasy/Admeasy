import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from './context/UserContext.jsx'
import { MentorProvider } from './context/MentorContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import * as pdfjsLib from "pdfjs-dist"
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
import axios from 'axios';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

axios.defaults.withCredentials = true;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes — feeds stay fresh
      gcTime: 10 * 60 * 1000,   // 10 minutes cache retention
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Native splash: hide Capacitor splash + custom HTML splash when app is ready
const hideNativeSplash = async () => {
  if (!Capacitor.isNativePlatform()) return
  try {
    await SplashScreen.hide()
  } catch (err) {
    console.error('Failed to hide splash screen', err)
  }
}

const splash = document.getElementById('mobile-splash')
if (splash) {
  if (Capacitor.isNativePlatform()) {
    splash.classList.add('visible')
    const onAppReady = () => {
      hideNativeSplash()
      splash.classList.add('fade-out')
      setTimeout(() => splash.remove(), 400)
    }
    if (document.readyState === 'complete') {
      onAppReady()
    } else {
      window.addEventListener('load', onAppReady)
    }
  } else {
    splash.remove()
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UserProvider>
          <MentorProvider>
            <SocketProvider>
              <App />
            </SocketProvider>
          </MentorProvider>
        </UserProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
)
