import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthGate } from '@/features/access/AuthGate'
import { AdultPanel } from '@/features/adult/AdultPanel'
import { CollectionScreen } from '@/features/collection/CollectionScreen'
import { HomeScreen } from '@/features/home/HomeScreen'
import { ChallengeScreen } from '@/features/maths/ChallengeScreen'
import { LearnScreen } from '@/features/maths/LearnScreen'
import { MatchScreen } from '@/features/maths/MatchScreen'
import { MathsHubScreen } from '@/features/maths/MathsHubScreen'
import { ModeSelectScreen } from '@/features/maths/ModeSelectScreen'
import { SessionSummaryScreen } from '@/features/maths/SessionSummaryScreen'
import { TablesSelectScreen } from '@/features/maths/TablesSelectScreen'
import { TrainScreen } from '@/features/maths/TrainScreen'
import { MissionsScreen } from '@/features/missions/MissionsScreen'
import { SubjectPreviewScreen } from '@/features/missions/SubjectPreviewScreen'
import { LumoGallery } from '@/lumo/LumoGallery'

export default function App() {
  return (
    <Routes>
      <Route path="/dev/lumo" element={<LumoGallery />} />
      <Route element={<AuthGate />}>
        <Route path="/adult" element={<AdultPanel />} />
        <Route path="/" element={<HomeScreen />} />
        <Route path="/missions" element={<MissionsScreen />} />
        <Route path="/missions/mates" element={<MathsHubScreen />} />
        <Route path="/missions/mates/tables" element={<TablesSelectScreen />} />
        <Route path="/missions/mates/tables/modes" element={<ModeSelectScreen />} />
        <Route path="/missions/mates/tables/learn" element={<LearnScreen />} />
        <Route path="/missions/mates/tables/train" element={<TrainScreen />} />
        <Route path="/missions/mates/tables/challenge" element={<ChallengeScreen />} />
        <Route path="/missions/mates/tables/match" element={<MatchScreen />} />
        <Route path="/missions/mates/tables/summary" element={<SessionSummaryScreen />} />
        <Route path="/missions/:subjectId" element={<SubjectPreviewScreen />} />
        <Route path="/collection" element={<CollectionScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
