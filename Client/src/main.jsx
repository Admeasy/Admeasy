import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from './context/UserContext.jsx'
import { MentorProvider } from './context/MentorContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'


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
