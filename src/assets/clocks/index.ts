import langCa from './clock-lang-ca.jpg'
import langEs from './clock-lang-es.jpg'

export type ClockLangArtId = 'es' | 'ca'

export const clockLangArt: Record<ClockLangArtId, string> = {
  es: langEs,
  ca: langCa,
}

export function clockLangArtUrl(id: ClockLangArtId): string {
  return clockLangArt[id]
}
