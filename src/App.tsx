import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { ScrollToTop } from '@/components/ScrollToTop'
import { AccessScreen } from '@/features/access/AccessScreen'
import { AuthGate } from '@/features/access/AuthGate'
import { ProfilePickerScreen } from '@/features/access/ProfilePickerScreen'
import { RegisterScreen } from '@/features/access/RegisterScreen'
import { AdultPanel } from '@/features/adult/AdultPanel'
import { CollectionScreen } from '@/features/collection/CollectionScreen'
import { HomeScreen } from '@/features/home/HomeScreen'
import { ChallengeScreen } from '@/features/maths/ChallengeScreen'
import { CalcModeSelectScreen } from '@/features/maths/calc/CalcModeSelectScreen'
import { CalcPlayScreen } from '@/features/maths/calc/CalcPlayScreen'
import { CalcSummaryScreen } from '@/features/maths/calc/CalcSummaryScreen'
import { ClockLearnScreen } from '@/features/maths/clocks/ClockLearnScreen'
import { ClockMatchScreen } from '@/features/maths/clocks/ClockMatchScreen'
import { ClockModeSelectScreen } from '@/features/maths/clocks/ClockModeSelectScreen'
import { ClockSummaryScreen } from '@/features/maths/clocks/ClockSummaryScreen'
import { ClockTrainScreen } from '@/features/maths/clocks/ClockTrainScreen'
import { MoneyModeSelectScreen } from '@/features/maths/money/MoneyModeSelectScreen'
import { MoneyPlayScreen } from '@/features/maths/money/MoneyPlayScreen'
import { MoneySummaryScreen } from '@/features/maths/money/MoneySummaryScreen'
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
import { FormarPalabrasPlayScreen } from '@/features/languages/formar-palabras/FormarPalabrasPlayScreen'
import { FormarPalabrasSummaryScreen } from '@/features/languages/formar-palabras/FormarPalabrasSummaryScreen'
import { ClasificaPlayScreen } from '@/features/languages/words/ClasificaPlayScreen'
import { ClasificaSummaryScreen } from '@/features/languages/words/ClasificaSummaryScreen'
import { MontaFrasePlayScreen } from '@/features/languages/words/MontaFrasePlayScreen'
import { MontaFraseSummaryScreen } from '@/features/languages/words/MontaFraseSummaryScreen'
import { PalabrasMcqPlayScreen } from '@/features/languages/words/PalabrasMcqPlayScreen'
import { PalabrasMcqSummaryScreen } from '@/features/languages/words/PalabrasMcqSummaryScreen'
import { VariosPlayScreen } from '@/features/languages/words/VariosPlayScreen'
import { VariosSummaryScreen } from '@/features/languages/words/VariosSummaryScreen'
import { WordsModeSelectScreen } from '@/features/languages/words/WordsModeSelectScreen'
import { SpellModeSelectScreen } from '@/features/languages/spelling/SpellModeSelectScreen'
import { SpellPlayScreen } from '@/features/languages/spelling/SpellPlayScreen'
import { SpellSummaryScreen } from '@/features/languages/spelling/SpellSummaryScreen'
import { EnglishHubScreen } from '@/features/english/EnglishHubScreen'
import { EnglishStationScreen } from '@/features/english/EnglishStationScreen'
import { EnglishModeSelectScreen } from '@/features/english/EnglishModeSelectScreen'
import { EnglishMatchPlayScreen } from '@/features/english/EnglishMatchPlayScreen'
import { EnglishPlayScreen } from '@/features/english/EnglishPlayScreen'
import { EnglishSummaryScreen } from '@/features/english/EnglishSummaryScreen'
import { MissionsScreen } from '@/features/missions/MissionsScreen'
import { SubjectPreviewScreen } from '@/features/missions/SubjectPreviewScreen'
import { LumoGallery } from '@/lumo/LumoGallery'
import { OrtografiaRrPilotScreen } from '@/dev/OrtografiaRrPilotScreen'

export default function App() {
  const location = useLocation()

  return (
    <>
      <ScrollToTop />
      <Routes location={location}>
      <Route path="/dev/lumo" element={<LumoGallery />} />
      <Route path="/dev/ortografia-rr" element={<OrtografiaRrPilotScreen />} />
      <Route element={<AuthGate />}>
        <Route path="/access" element={<AccessScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/pick-profile" element={<ProfilePickerScreen />} />
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
        <Route path="/missions/mates/clocks/misses" element={<ClockTrainScreen />} />
        <Route path="/missions/mates/clocks/match" element={<ClockMatchScreen />} />
        <Route path="/missions/mates/clocks/summary" element={<ClockSummaryScreen />} />
        <Route path="/missions/mates/calc" element={<CalcModeSelectScreen />} />
        <Route path="/missions/mates/calc/summary" element={<CalcSummaryScreen />} />
        <Route path="/missions/mates/calc/:mode" element={<CalcPlayScreen />} />
        <Route path="/missions/mates/money" element={<MoneyModeSelectScreen />} />
        <Route path="/missions/mates/money/summary" element={<MoneySummaryScreen />} />
        <Route path="/missions/mates/money/:mode" element={<MoneyPlayScreen />} />
        <Route path="/missions/languages" element={<LanguagesHubScreen />} />
        <Route path="/missions/languages/alphabet" element={<AlphabetModeSelectScreen />} />
        <Route path="/missions/languages/alphabet/summary" element={<AlphabetSummaryScreen />} />
        <Route path="/missions/languages/alphabet/:mode" element={<AlphabetPlayScreen />} />
        <Route path="/missions/languages/spelling" element={<SpellModeSelectScreen />} />
        <Route path="/missions/languages/spelling/summary" element={<SpellSummaryScreen />} />
        <Route path="/missions/languages/spelling/:mode" element={<SpellPlayScreen />} />
        <Route path="/missions/languages/words" element={<WordsModeSelectScreen />} />
        <Route
          path="/missions/languages/words/formar-palabras"
          element={<Navigate to="/missions/languages/formar-palabras" replace />}
        />
        <Route
          path="/missions/languages/words/formar-palabras/summary"
          element={<Navigate to="/missions/languages/formar-palabras/summary" replace />}
        />
        <Route
          path="/missions/languages/words/clasifica/summary"
          element={<ClasificaSummaryScreen />}
        />
        <Route
          path="/missions/languages/words/clasifica"
          element={<ClasificaPlayScreen />}
        />
        <Route
          path="/missions/languages/words/monta-frase/summary"
          element={<MontaFraseSummaryScreen />}
        />
        <Route
          path="/missions/languages/words/monta-frase"
          element={<MontaFrasePlayScreen />}
        />
        <Route
          path="/missions/languages/words/quien-hace-que/summary"
          element={<VariosSummaryScreen />}
        />
        <Route
          path="/missions/languages/words/quien-hace-que"
          element={<VariosPlayScreen />}
        />
        <Route
          path="/missions/languages/words/comun-propio/summary"
          element={<VariosSummaryScreen />}
        />
        <Route
          path="/missions/languages/words/comun-propio"
          element={<VariosPlayScreen />}
        />
        <Route
          path="/missions/languages/words/singular-plural"
          element={<Navigate to="/missions/languages/words/clasifica" replace />}
        />
        <Route
          path="/missions/languages/words/masculino-femenino"
          element={<Navigate to="/missions/languages/words/clasifica" replace />}
        />
        <Route
          path="/missions/languages/words/sinonimos/summary"
          element={<Navigate to="/missions/languages/words/sinonimos-antonimos/summary" replace />}
        />
        <Route
          path="/missions/languages/words/sinonimos"
          element={<Navigate to="/missions/languages/words/sinonimos-antonimos" replace />}
        />
        <Route
          path="/missions/languages/words/antonimos/summary"
          element={<Navigate to="/missions/languages/words/sinonimos-antonimos/summary" replace />}
        />
        <Route
          path="/missions/languages/words/antonimos"
          element={<Navigate to="/missions/languages/words/sinonimos-antonimos" replace />}
        />
        <Route
          path="/missions/languages/words/:productId/summary"
          element={<PalabrasMcqSummaryScreen />}
        />
        <Route path="/missions/languages/words/:productId" element={<PalabrasMcqPlayScreen />} />
        <Route path="/missions/languages/formar-palabras" element={<FormarPalabrasPlayScreen />} />
        <Route
          path="/missions/languages/formar-palabras/summary"
          element={<FormarPalabrasSummaryScreen />}
        />
        <Route path="/missions/english" element={<Outlet />}>
          <Route index element={<EnglishHubScreen />} />
          <Route path="pack/:packId/summary" element={<EnglishSummaryScreen />} />
          <Route path="pack/:packId/match" element={<EnglishMatchPlayScreen />} />
          <Route path="pack/:packId/:mode" element={<EnglishPlayScreen />} />
          <Route path="pack/:packId" element={<EnglishModeSelectScreen />} />
          <Route path=":stationId" element={<EnglishStationScreen />} />
        </Route>
        <Route path="/missions/:subjectId" element={<SubjectPreviewScreen />} />
        <Route path="/collection" element={<CollectionScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </>
  )
}
