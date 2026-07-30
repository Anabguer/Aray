import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { AuthProvider } from '@/auth/AuthContext'
import { PlayProvider } from '@/progress/PlayContext'
import { ProgressProvider } from '@/progress/ProgressContext'
import { createInitialProgress, createLocalStorageProgressStore } from '@/progress/repository'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('network disabled in tests'))),
  )
})

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key) {
      return map.has(key) ? map.get(key)! : null
    },
    key(index) {
      return [...map.keys()][index] ?? null
    },
    removeItem(key) {
      map.delete(key)
    },
    setItem(key, value) {
      map.set(key, value)
    },
  }
}

function renderAt(path: string) {
  const store = createLocalStorageProgressStore(memoryStorage())
  store.save(createInitialProgress())
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider
        initialSession={{
          role: null,
          account: null,
          csrf: 'test-csrf',
          players: [],
        }}
      >
        <ProgressProvider store={store}>
          <PlayProvider>
            <App />
          </PlayProvider>
        </ProgressProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ARAY navigation shell', () => {
  it('muestra la portada lobby', () => {
    renderAt('/')
    expect(screen.getByText('LOBBY')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /¡hola, aray!/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^jugar$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /aprende la tabla|tu misión de hoy|entrena la tabla/i })).toBeInTheDocument()
    expect(screen.queryByText(/¿jugamos, aray\?/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/tu espacio para misiones/i)).not.toBeInTheDocument()
  })

  it('abre la pantalla de misiones con matemáticas jugable', () => {
    renderAt('/missions')
    expect(screen.getByRole('heading', { name: /^mis mundos$/i })).toBeInTheDocument()
    expect(screen.getByText(/elige tu próxima aventura/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^volver al lobby$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /matemáticas\. entrar al mundo/i })).toBeInTheDocument()
    expect(screen.getByText(/¡empieza por aquí!/i)).toBeInTheDocument()
    expect(screen.getByText(/¡vamos a mates!/i)).toBeInTheDocument()
    expect(screen.getByText(/^entrar$/i)).toBeInTheDocument()
    expect(screen.getAllByText(/próximamente/i).length).toBeGreaterThanOrEqual(1)
  })

  it('abre el mapa de niveles sin 1 ni 10', () => {
    renderAt('/missions/mates/tables')
    expect(screen.getByRole('heading', { name: /^niveles$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mezcla/i })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /tablas del 2 al 9/i })).toBeInTheDocument()
  })

  it('muestra modos con Empareja y misión sorpresa', () => {
    renderAt('/missions/mates/tables/modes')
    expect(screen.getByRole('heading', { name: /elige tu modo/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ir al lobby/i })).toHaveTextContent(/lobby/i)
    expect(screen.getByRole('button', { name: /empareja/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sorpresa/i })).toBeInTheDocument()
  })

  it('muestra controles unificados: ayuda, sonido y acceso adulto', () => {
    renderAt('/')
    expect(screen.getByRole('toolbar', { name: /controles del lobby/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/cómo se juega/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /silenciar sonido|activar sonido/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /acceso adulto/i })).toBeInTheDocument()
  })

  it('redirige /adult al lobby sin sesión adulta', () => {
    renderAt('/adult')
    expect(screen.getByRole('heading', { name: /¡hola, aray!/i })).toBeInTheDocument()
    expect(screen.queryByText(/panel familiar/i)).not.toBeInTheDocument()
  })
})
