/** Tipos compartidos del banco de feinetas (minijuegos reutilizables). */

export type FeinetaId =
  | 'formar-palabras'
  | 'completar-palabra'
  | 'r-rr'
  | 'h'
  | 'familias-palabras'
  | 'sinonimos'

export type FeinetaMecanica = {
  tipo: string
  casillas_superiores?: boolean
  letras_desordenadas?: boolean
  mantener_letras_al_fallar?: boolean
  [key: string]: unknown
}

export type FeinetaCorreccion = {
  automatica?: boolean
  acierto?: { color?: string; sonido?: boolean; animacion?: boolean }
  fallo?: { color?: string; contar_fallo?: boolean }
  [key: string]: unknown
}

export type FeinetaAyudas = {
  tras_3_fallos?: string
  [key: string]: unknown
}

export type FormarPalabraItem = {
  id: string
  palabra: string
  grupo: string
  dificultad: number
  letras: number
}

export type FormarPalabrasFeineta = {
  nombre: string
  version: number
  nivel: string
  objetivo: string
  mecanica: FeinetaMecanica
  correccion: FeinetaCorreccion
  ayudas: FeinetaAyudas
  objetivo_palabras: number
  palabras: FormarPalabraItem[]
}

/** Forma genérica: ficha + mecánica + reglas + UX + banco. */
export type FeinetaDocument = {
  nombre: string
  version: number
  nivel: string
  objetivo: string
  mecanica: FeinetaMecanica
  correccion: FeinetaCorreccion
  ayudas: FeinetaAyudas
  [key: string]: unknown
}
