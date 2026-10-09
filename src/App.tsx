import { useMemo, useState } from 'react'
import {
  loadAlertPreferences,
  type AlertPreferences,
} from './lib/alerts'
import { PHASE_COLORS } from './lib/cues'
import { buildSchedule, type RoundSettings } from './lib/schedule'
import { useThemeColor } from './lib/useThemeColor'
import SetupScreen from './components/SetupScreen'
import TimerScreen from './components/TimerScreen'

export default function App() {
  const [settings, setSettings] = useState<RoundSettings | null>(null)
  const [draft, setDraft] = useState<RoundSettings>({
    gov: 'standard',
    opp: 'standard',
  })
  const [index, setIndex] = useState(0)
  const [preferences, setPreferences] = useState<AlertPreferences>(
    loadAlertPreferences,
  )

  const schedule = useMemo(
    () => (settings ? buildSchedule(settings) : []),
    [settings],
  )

  return (
    <div className="min-h-dvh py-4 sm:py-8">
      {settings ? (
        <TimerScreen
          schedule={schedule}
          index={index}
          onSelect={setIndex}
          onBackToSetup={() => {
            setDraft(settings)
            setSettings(null)
            setIndex(0)
          }}
          preferences={preferences}
          onPreferencesChange={setPreferences}
        />
      ) : (
        <SetupPane
          initialSettings={draft}
          onStart={(next) => {
            setSettings(next)
            setIndex(0)
          }}
        />
      )}
    </div>
  )
}

/** Garde le fond neutre tant qu'aucune ronde n'est lancée. */
function SetupPane(props: {
  initialSettings: RoundSettings
  onStart: (settings: RoundSettings) => void
}) {
  useThemeColor(PHASE_COLORS.idle)
  return <SetupScreen {...props} />
}
