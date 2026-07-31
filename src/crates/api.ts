import { apiPost } from '@/api/client'
import type { ServerProgressSnapshot } from '@/sync/mapServerProgress'
import { ensureChildPlaySession, type EnsureChildOpts } from '@/sync/playSession'

type CrateActionResponse = {
  pending?: unknown
  progress?: ServerProgressSnapshot
  applied?: boolean
  adjustmentNote?: string | null
  csrf?: string
}

async function withChildSession<T>(
  opts: EnsureChildOpts | undefined,
  run: () => Promise<T>,
): Promise<T | null> {
  const child = await ensureChildPlaySession(opts)
  if (!child) return null
  return run()
}

export async function postCrateChoose(
  completionId: string,
  chosenIndex: number,
  opts?: EnsureChildOpts,
) {
  return withChildSession(opts, () =>
    apiPost<CrateActionResponse>('/players/crate-choose.php', {
      completionId,
      chosenIndex,
    }),
  )
}

export async function postCrateOpen(completionId: string, opts?: EnsureChildOpts) {
  return withChildSession(opts, () =>
    apiPost<CrateActionResponse>('/players/crate-open.php', { completionId }),
  )
}

export async function postCrateClaim(completionId: string, opts?: EnsureChildOpts) {
  return withChildSession(opts, () =>
    apiPost<CrateActionResponse>('/players/crate-claim.php', { completionId }),
  )
}
