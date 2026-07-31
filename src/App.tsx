import { Navigate, Route, Routes } from 'react-router-dom'
import { ScrollToTop } from '@/components/ScrollToTop'
import { AuthGate } from '@/features/access/AuthGate'
import { AdultPanel } from '@/features/adult/AdultPanel'
import { CollectionScreen } from '@/features/collection/CollectionScreen'
import { HomeScreen } from '@/features/home/HomeScreen'
import { ChallengeScreen } from '@/features/maths/ChallengeScreen'
import { ClockLearnScreen } from '@/features/maths/clocks/ClockLearnScreen'
import { ClockMatchScreen } from '@/features/maths/clocks/ClockMatchScreen'
import { ClockModeSelectScreen } from '@/features/maths/clocks/ClockModeSelectScreen'
import { ClockSummaryScreen } from '@/features/maths/clocks/ClockSummaryScreen'
import { ClockTrainScreen } from '@/features/maths/clocks/ClockTrainScreen'
import { LearnScreen } from '@/features/maths/LearnScreen'
import { MatchScreen } from '@/features/maths/MatchScreen'
import { MathsHubScreen } from '@/features/maths/MathsHubScreen'
import { ModeSelectScreen } from '@/features/maths/ModeSelectScreen'
import { SessionSummaryScreen } from '@/features/maths/SessionSummaryScreen'
import { TablesSelectScreen } from '@/features/maths/TablesSelectScreen'
import { TrainScreen } from '@/features/maths/TrainScreen'
import { AlphabetModeSelectScreen } from '@/features/languages/AlphabetModeSelectScreen'
import { AlphabetPlayScreen } from '@/features/languages/AlphabetPlayScreen'
import { AlphabetSummaryScreen } from '@/features/languages/AlphabetSummaryScreen'
import { LanguagesHubScreen } from '@/features/languages/LanguagesHubScreen'
import { MissionsScreen } from '@/features/missions/MissionsScreen'
import { SubjectPreviewScreen } from '@/features/missions/SubjectPreviewScreen'
import { LumoGallery } from '@/lumo/LumoGallery'

export default function App() {
  return (
    <>
      <ScrollToTop />
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
        <Route path="/missions/mates/clocks" element={<ClockModeSelectScreen />} />
        <Route path="/missions/mates/clocks/modes" element={<Navigate to="/missions/mates/clocks" replace />} />
        <Route path="/missions/mates/clocks/learn" element={<ClockLearnScreen />} />
        <Route path="/missions/mates/clocks/train" element={<ClockTrainScreen />} />
        <Route path="/missions/mates/clocks/match" element={<ClockMatchScreen />} />
        <Route path="/missions/mates/clocks/summary" element={<ClockSummaryScreen />} />
        <Route path="/missions/languages" element={<LanguagesHubScreen />} />
        <Route path="/missions/languages/alphabet" element={<AlphabetModeSelectScreen />} />
        <Route path="/missions/languages/alphabet/summary" element={<AlphabetSummaryScreen />} />
        <Route path="/missions/languages/alphabet/:mode" element={<AlphabetPlayScreen />} />
        <Route path="/missions/:subjectId" element={<SubjectPreviewScreen />} />
        <Route path="/collection" element={<CollectionScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </>
  )
}
