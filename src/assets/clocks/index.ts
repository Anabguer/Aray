import langCa from './clock-lang-ca.png'
import langEs from './clock-lang-es.png'

export type ClockLangArtId = 'es' | 'ca'

export const clockLangArt: Record<ClockLangArtId, string> = {
  es: langEs,
  ca: langCa,
}

export function clockLangArtUrl(id: ClockLangArtId): string {
  return clockLangArt[id]
}
