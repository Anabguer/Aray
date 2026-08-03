import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { AuthProvider } from '@/auth/AuthContext'
import { AlphabetSessionProvider } from '@/alphabet/AlphabetSessionContext'
import { CalcSessionProvider } from '@/calc/CalcSessionContext'
import { ClockSessionProvider } from '@/clock/ClockSessionContext'
import { DailyMissionProvider } from '@/daily/DailyMissionContext'
import { MoneySessionProvider } from '@/money/MoneySessionContext'
import { SpellSessionProvider } from '@/spelling/SpellSessionContext'
import { EnglishSessionProvider } from '@/english'
import { PlayProvider } from '@/progress/PlayContext'
import { ProgressProvider } from '@/progress/ProgressContext'
import './index.css'
import './feedback/feedback.css'

/** '/aray/afkacademy/' → '/aray/afkacademy' · '/' → raíz */
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
            <DailyMissionProvider>
              <ClockSessionProvider>
                <AlphabetSessionProvider>
                  <CalcSessionProvider>
                    <SpellSessionProvider>
                      <EnglishSessionProvider>
                        <MoneySessionProvider>
                          <App />
                        </MoneySessionProvider>
                      </EnglishSessionProvider>
                    </SpellSessionProvider>
                  </CalcSessionProvider>
                </AlphabetSessionProvider>
              </ClockSessionProvider>
            </DailyMissionProvider>
          </PlayProvider>
        </ProgressProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  const swUrl = `${import.meta.env.BASE_URL}sw.js?v=11`
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(swUrl).catch(() => {
      /* SW opcional: no bloquea el juego */
    })
  })
  // Tras un deploy, recargar una vez para no quedarse con JS antiguo.
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}
