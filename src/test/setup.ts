import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

class MockAudio {
  preload = ''
  volume = 1
  currentTime = 0
  paused = true
  ended = false
  onended: ((this: HTMLAudioElement, ev: Event) => void) | null = null
  constructor(_src?: string) {}
  addEventListener() {}
  setAttribute() {}
  load() {}
  play() {
    this.paused = false
    return Promise.resolve()
  }
  pause() {
    this.paused = true
  }
  cloneNode() {
    return new MockAudio()
  }
}

vi.stubGlobal('Audio', MockAudio)