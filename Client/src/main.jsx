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
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
} from './auth/googleSignInConstants';

axios.defaults.withCredentials = true;

const isNative = Capacitor.isNativePlatform();

if (isNative) {
  const splash = document.getElementById("mobile-splash");
  if (splash) splash.classList.add("visible");
}
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


if (isNative) {
  const platform = Capacitor.getPlatform();
  const clientId =
    platform === 'android'
      ? GOOGLE_ANDROID_CLIENT_ID
      : GOOGLE_WEB_CLIENT_ID;

  GoogleAuth.initialize({
    clientId,
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  });
}

// Native splash: hide Capacitor splash + custom HTML splash when app is ready
const hideNativeSplash = async () => {
  if (!Capacitor.isNativePlatform()) return
  try {
    await SplashScreen.hide()
  } catch (err) {
    console.error('Failed to hide splash screen', err)
  }
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
