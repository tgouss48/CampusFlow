import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AnnoncesModalProvider } from './context/AnnoncesModalContext'
import { NotificationsProvider } from './context/NotificationsContext'
import { SocialProvider } from './context/SocialContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <SocialProvider>
        <NotificationsProvider>
          <AnnoncesModalProvider>
            <App />
          </AnnoncesModalProvider>
        </NotificationsProvider>
      </SocialProvider>
    </AuthProvider>
  </BrowserRouter>,
)
