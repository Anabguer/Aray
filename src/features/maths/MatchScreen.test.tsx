import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MatchScreen } from '@/features/maths/MatchScreen'
import {
  buildMatchPairs,
  buildMatchRounds,
  isCorrectMatch,
  MATCH_MAX_PER_ROUND,
  MATCH_WRONG_MESSAGE,
  matchHintForAttempt,
  shuffleProductsNotAligned,
  splitRounds,
} from '@/math/match'
import { matchFactorRange } from '@/config/playConfig'
import { PlayProvider } from '@/progress/PlayContext'
import { ProgressProvider } from '@/progress/ProgressContext'
import { createInitialProgress, createLocalStorageProgressStore } from '@/progress/repository'

vi.mock('@/sound/soundEngine', () => ({
  soundEngine: { play: vi.fn(), setMuted: vi.fn() },
}))

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

function renderMatch(table = 3) {
  const store = createLocalStorageProgressStore(memoryStorage())
  store.save(createInitialProgress())
  sessionStorage.setItem('aray.tables.selection', JSON.stringify({ tables: [table], mix: false }))
  return render(
    <MemoryRouter initialEntries={['/missions/mates/tables/match']}>
      <ProgressProvider store={store}>
        <PlayProvider>
          <Routes>
            <Route path="/missions/mates/tables/match" element={<MatchScreen />} />
            <Route path="/missions/mates/tables/summary" element={<div>Resumen</div>} />
            <Route path="/missions/mates/tables/modes" element={<div>Modos</div>} />
          </Routes>
        </PlayProvider>
      </ProgressProvider>
    </MemoryRouter>,
  )
}

async function settle(ms = 550) {
  await new Promise((r) => setTimeout(r, ms))
}

describe('Empareja la tabla — lógica', () => {
  it('genera operaciones y resultados desordenados sin alinear', () => {
    const pairs = buildMatchPairs(8)
    expect(pairs).toHaveLength(10)
    expect(pairs[0].factor).toBe(matchFactorRange.min)
    expect(pairs.at(-1)?.factor).toBe(matchFactorRange.max)
    const products = shuffleProductsNotAligned(pairs, () => 0.2)
    expect(products).toHaveLength(10)
    expect(new Set(products).size).toBe(10)
    expect(products.every((p, i) => p === pairs[i].product)).toBe(false)
  })

  it('divide en rondas de máximo cinco parejas (1–5 y 6–10)', () => {
    const rounds = buildMatchRounds(buildMatchPairs(7), MATCH_MAX_PER_ROUND)
    expect(rounds).toHaveLength(2)
    expect(rounds[0]).toHaveLength(5)
    expect(rounds[1]).toHaveLength(5)
    expect(rounds[0].map((p) => p.factor)).toEqual([1, 2, 3, 4, 5])
    expect(rounds[1].map((p) => p.factor)).toEqual([6, 7, 8, 9, 10])
    expect(rounds.every((r) => r.length <= MATCH_MAX_PER_ROUND)).toBe(true)
  })

  it('con rango hasta 12 usa 4+4+4', () => {
    const pairs = buildMatchPairs(3, { min: 1, max: 12 })
    const rounds = buildMatchRounds(pairs, MATCH_MAX_PER_ROUND)
    expect(rounds.map((r) => r.length)).toEqual([4, 4, 4])
  })

  it('splitRounds sigue chunkando por tamaño', () => {
    const rounds = splitRounds(buildMatchPairs(7), 5)
    expect(rounds).toHaveLength(2)
  })

  it('valida pareja correcta e incorrecta', () => {
    const pair = buildMatchPairs(3)[2]
    expect(isCorrectMatch(pair, 9)).toBe(true)
    expect(isCorrectMatch(pair, 8)).toBe(false)
  })

  it('el primer fallo no revela la respuesta; pistas progresivas después', () => {
    expect(matchHintForAttempt(3, 15, 1)).toBeNull()
    expect(matchHintForAttempt(3, 15, 2)).toBe('Piensa en la tabla del 3')
    expect(matchHintForAttempt(3, 15, 3)).toBe('Es mayor que 10 y menor que 20')
    expect(matchHintForAttempt(3, 15, 3)).not.toContain('15')
  })
})

describe('Empareja la tabla — pantalla', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('no muestra el botón Comprobar y limita la ronda a cinco', () => {
    renderMatch(3)
    expect(screen.queryByRole('button', { name: /comprobar/i })).not.toBeInTheDocument()
    expect(screen.getByText(/ronda 1 de 2 · 0\/5 parejas/i)).toBeInTheDocument()
    const ops = screen.getByRole('list', { name: /operaciones/i })
    expect(within(ops).getAllByRole('button')).toHaveLength(5)
  })

  it('valida y fija de inmediato una pareja correcta', async () => {
    renderMatch(3)
    fireEvent.click(screen.getByRole('button', { name: /^resultado 9$/i }))
    expect(screen.getByText(/resultado seleccionado/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /3 × 3, vacío/i }))

    expect(await screen.findByRole('button', { name: /3 × 3 = 9, correcta/i })).toBeDisabled()
    expect(screen.getByText(/¡encaja!/i)).toBeInTheDocument()
    expect(screen.getByText(/ronda 1 de 2 · 1\/5 parejas/i)).toBeInTheDocument()
  })

  it('una incorrecta vuelve disponible y registra el fallo sin revelar', async () => {
    renderMatch(3)
    fireEvent.click(screen.getByRole('button', { name: /^resultado 12$/i }))
    fireEvent.click(screen.getByRole('button', { name: /3 × 3, vacío/i }))

    expect(await screen.findByText(MATCH_WRONG_MESSAGE)).toBeInTheDocument()
    expect(screen.queryByText(/= 9/)).not.toBeInTheDocument()

    await settle()
    expect(screen.getByRole('button', { name: /^resultado 12$/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /3 × 3, vacío/i })).toBeEnabled()
  })

  it('muestra pistas progresivas en la misma operación', async () => {
    renderMatch(3)
    const wrong = async () => {
      fireEvent.click(screen.getByRole('button', { name: /^resultado 12$/i }))
      fireEvent.click(screen.getByRole('button', { name: /3 × 3, vacío/i }))
      await settle()
    }

    await wrong()
    expect(screen.getByText(MATCH_WRONG_MESSAGE)).toBeInTheDocument()

    await wrong()
    expect(screen.getByText(/piensa en la tabla del 3/i)).toBeInTheDocument()

    await wrong()
    expect(screen.getByText(/mayor que 0 y menor que 10/i)).toBeInTheDocument()
  })

  it('completa la ronda solo cuando las cinco están fijas y no auto-avanza', async () => {
    renderMatch(3)
    const pairs = buildMatchRounds(buildMatchPairs(3))[0]
    for (const pair of pairs) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^resultado ${pair.product}$`, 'i') }))
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`${pair.label}, vacío`, 'i') }))
      await settle(520)
    }

    expect(await screen.findByRole('button', { name: /siguiente ronda/i })).toBeInTheDocument()
    expect(screen.getByText(/¡ronda completada!/i)).toBeInTheDocument()
    expect(screen.queryByText(/ronda 2 de 2 · 0\/5/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /siguiente ronda/i }))
    await waitFor(() => {
      expect(screen.getByText(/ronda 2 de 2 · 0\/5 parejas/i)).toBeInTheDocument()
    })
  })

  it('permite asociar con teclado (Enter)', async () => {
    renderMatch(3)
    const product = screen.getByRole('button', { name: /^resultado 6$/i })
    product.focus()
    fireEvent.keyDown(product, { key: 'Enter' })
    expect(screen.getByText(/resultado seleccionado/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /3 × 2, vacío/i }))
    expect(await screen.findByRole('button', { name: /3 × 2 = 6, correcta/i })).toBeInTheDocument()
  })

  it('asocia por arrastre (drop)', async () => {
    renderMatch(3)
    const product = screen.getByRole('button', { name: /^resultado 3$/i })
    const op = screen.getByRole('button', { name: /3 × 1, vacío/i })
    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(type: string, value: string) {
        this.data[type] = value
      },
      getData(type: string) {
        return this.data[type] ?? ''
      },
    }
    fireEvent.dragStart(product, { dataTransfer })
    fireEvent.drop(op, { dataTransfer })
    expect(await screen.findByRole('button', { name: /3 × 1 = 3, correcta/i })).toBeInTheDocument()
  })
})
