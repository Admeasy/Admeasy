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

<<<<<<< HEAD
const isNative = Capacitor.isNativePlatform();

if (isNative) {
  const splash = document.getElementById("mobile-splash");
  if (splash) splash.classList.add("visible");
=======
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
>>>>>>> 32930030 (Implemented Study and Masti mode)
}

// Hide native splash and web overlay once React loads (native only)
window.addEventListener("load", async () => {
  if (Capacitor.isNativePlatform()) {
    const splash = document.getElementById("mobile-splash");

    try {
      setTimeout(async () => {
        await SplashScreen.hide();

        if (splash) {
          splash.classList.add("fade-out");
          setTimeout(() => splash.remove(), 400);
        }
      }, 1200);
    } catch (error) {
      console.error("Error hiding splash screen:", error);
    }
  }
});

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