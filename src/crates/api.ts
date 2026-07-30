import { apiPost } from '@/api/client'
import type { ServerProgressSnapshot } from '@/sync/mapServerProgress'

type CrateActionResponse = {
  pending?: unknown
  progress?: ServerProgressSnapshot
  applied?: boolean
  adjustmentNote?: string | null
  csrf?: string
}

export async function postCrateChoose(completionId: string, chosenIndex: number) {
  return apiPost<CrateActionResponse>('/players/crate-choose.php', {
    completionId,
    chosenIndex,
  })
}

export async function postCrateOpen(completionId: string) {
  return apiPost<CrateActionResponse>('/players/crate-open.php', { completionId })
}

export async function postCrateClaim(completionId: string) {
  return apiPost<CrateActionResponse>('/players/crate-claim.php', { completionId })
}
