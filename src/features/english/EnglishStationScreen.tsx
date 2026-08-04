import { Navigate, useParams } from 'react-router-dom'
import { EnglishStationModesView } from '@/features/english/EnglishStationModesView'
import { isEnglishStationId } from '@/feinetas/englishRegistry'

/** Deep link: /missions/english/:stationId → Mis fallos + Random. */
export function EnglishStationScreen() {
  const { stationId } = useParams<{ stationId: string }>()
  if (!stationId || !isEnglishStationId(stationId)) {
    return <Navigate to="/missions/english" replace />
  }
  return <EnglishStationModesView stationId={stationId} />
}
