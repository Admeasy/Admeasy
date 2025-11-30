import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from './context/UserContext.jsx'
import { MentorProvider } from './context/MentorContext.jsx'
import { HelmetProvider } from 'react-helmet-async'
import zipyai from 'zipyai'

zipyai.init("5f4200af");

createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <BrowserRouter>
      <UserProvider>
        <MentorProvider>
          <App />
        </MentorProvider>
      </UserProvider>
    </BrowserRouter>
  </HelmetProvider>
);