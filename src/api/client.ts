/** Cliente JSON con cookies de sesión. La API vive en `/api/v1` (raíz del sitio), no bajo `/aray/`. */

const API_ROOT = '/api/v1'

let csrfCache: string | null = null

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type ApiEnvelope = {
  ok?: boolean
  error?: string
  message?: string
  csrf?: string
}

export function setCsrf(token: string | null): void {
  csrfCache = token
}

export function peekCsrf(): string | null {
  return csrfCache
}

async function parseJson(res: Response): Promise<ApiEnvelope & Record<string, unknown>> {
  let data: ApiEnvelope & Record<string, unknown>
  try {
    data = (await res.json()) as ApiEnvelope & Record<string, unknown>
  } catch {
    throw new ApiError(res.status, 'invalid_json', 'Respuesta no válida del servidor.')
  }
  if (typeof data.csrf === 'string' && data.csrf !== '') {
    csrfCache = data.csrf
  }
  if (!res.ok || data.ok === false) {
    throw new ApiError(
      res.status,
      typeof data.error === 'string' ? data.error : 'request_failed',
      typeof data.message === 'string' ? data.message : 'No se pudo completar la petición.',
    )
  }
  return data
}

export async function apiGet<T extends Record<string, unknown> = Record<string, unknown>>(
  path: string,
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  return (await parseJson(res)) as T
}

export async function apiPost<T extends Record<string, unknown> = Record<string, unknown>>(
  path: string,
  body: Record<string, unknown> = {},
  signal?: AbortSignal,
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`
  const csrf =
    typeof body.csrf === 'string' && body.csrf !== '' ? body.csrf : await getCsrf()
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, csrf }),
    signal,
  })
  return (await parseJson(res)) as T
}

/** Obtiene (o renueva) el token CSRF de sesión. */
export async function getCsrf(force = false): Promise<string> {
  if (!force && csrfCache) return csrfCache
  const data = await apiGet<{ csrf: string }>('/csrf.php')
  if (typeof data.csrf !== 'string' || data.csrf === '') {
    throw new ApiError(500, 'csrf_missing', 'No se pudo obtener el token de seguridad.')
  }
  csrfCache = data.csrf
  return csrfCache
}
