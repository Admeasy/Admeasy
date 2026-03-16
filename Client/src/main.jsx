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

axios.defaults.withCredentials = true;

const isNative = Capacitor.isNativePlatform();

if (isNative) {
  const splash = document.getElementById("mobile-splash");
  if (splash) splash.classList.add("visible");
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
    <BrowserRouter>
      <UserProvider>
        <MentorProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </MentorProvider>
      </UserProvider>
    </BrowserRouter>
  </ErrorBoundary>
)