import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { AuthProvider } from '@/auth/AuthContext'
import { AlphabetSessionProvider } from '@/alphabet/AlphabetSessionContext'
import { ClockSessionProvider } from '@/clock/ClockSessionContext'
import { PlayProvider } from '@/progress/PlayContext'
import { ProgressProvider } from '@/progress/ProgressContext'
import './index.css'
import './feedback/feedback.css'

/** '/aray/' → '/aray' · '/' → raíz */
function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL
  if (!base || base === '/' || base === './') return undefined
  return base.replace(/\/$/, '')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename()}>
      <AuthProvider>
        <ProgressProvider>
          <PlayProvider>
            <ClockSessionProvider>
              <AlphabetSessionProvider>
                <App />
              </AlphabetSessionProvider>
            </ClockSessionProvider>
          </PlayProvider>
        </ProgressProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  const swUrl = `${import.meta.env.BASE_URL}sw.js`
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(swUrl).catch(() => {
      /* SW opcional: no bloquea el juego */
    })
  })
}
