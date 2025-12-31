import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from './context/UserContext.jsx'
import { MentorProvider } from './context/MentorContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import * as pdfjsLib from "pdfjs-dist"
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <UserProvider>
      <MentorProvider>
        <SocketProvider>
        <App />
        </SocketProvider>
      </MentorProvider>
    </UserProvider>
  </BrowserRouter>
)
