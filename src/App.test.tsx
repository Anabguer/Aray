import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { PlayProvider } from '@/progress/PlayContext'
import { ProgressProvider } from '@/progress/ProgressContext'
import { createInitialProgress, createLocalStorageProgressStore } from '@/progress/repository'

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
      <ProgressProvider store={store}>
        <PlayProvider>
          <App />
        </PlayProvider>
      </ProgressProvider>
    </MemoryRouter>,
  )
}

describe('ARAY navigation shell', () => {
  it('muestra la portada lobby', () => {
    renderAt('/')
    expect(screen.getByText('LOBBY')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /¡hola, aray!/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^jugar$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /misión de hoy|tu misión de hoy/i })).toBeInTheDocument()
    expect(screen.getByText(/¿jugamos, aray\?/i)).toBeInTheDocument()
    expect(screen.queryByText(/tu espacio para misiones/i)).not.toBeInTheDocument()
  })

  it('abre la pantalla de misiones con matemáticas jugable', () => {
    renderAt('/missions')
    expect(screen.getByRole('heading', { name: /^misiones$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^matemáticas$/i })).toBeInTheDocument()
  })

  it('abre el mapa de niveles sin 1 ni 10', () => {
    renderAt('/missions/mates/tables')
    expect(screen.getByRole('heading', { name: /^niveles$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mezcla/i })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /tablas del 2 al 9/i })).toBeInTheDocument()
  })

  it('muestra modos con Empareja y Misión random', () => {
    renderAt('/missions/mates/tables/modes')
    expect(screen.getByRole('button', { name: /empareja/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /misión random/i })).toBeInTheDocument()
  })

  it('muestra próximamente en colección', () => {
    renderAt('/collection')
    expect(screen.getAllByText(/^próximamente$/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: /^mi colección$/i })).toBeInTheDocument()
  })
})
