import { useEffect, useMemo } from 'react'
import {
  playAlert,
  releaseWakeLock,
  requestWakeLock,
  saveAlertPreferences,
  unlockAudio,
  type AlertPreferences,
} from '../lib/alerts'
import {
  PHASE_COLORS,
  absoluteEndSec,
  buildCues,
  resolveColor,
  resolvePhase,
} from '../lib/cues'
import type { Speech } from '../lib/schedule'
import { useSignalAlerts } from '../lib/useSignalAlerts'
import { useStopwatch } from '../lib/useStopwatch'
import { useThemeColor } from '../lib/useThemeColor'
import { BrandHeader } from './Brand'
import SignalStage from './SignalStage'
import SpeechProgress from './SpeechProgress'
import SpeechTabs from './SpeechTabs'
import {
  FlashIcon,
  NextIcon,
  ResetIcon,
  SettingsIcon,
  SoundIcon,
  VibrationIcon,
} from './icons'

export default function TimerScreen({
  schedule,
  index,
  onSelect,
  onBackToSetup,
  preferences,
  onPreferencesChange,
}: {
  schedule: Speech[]
  index: number
  onSelect: (index: number) => void
  onBackToSetup: () => void
  preferences: AlertPreferences
  onPreferencesChange: (preferences: AlertPreferences) => void
}) {
  const speech = schedule[index]
  const cues = useMemo(() => buildCues(speech), [speech])
  const { elapsedMs, running, start, pause, reset } = useStopwatch()

  // Le chrono s'arrête net à la fin absolue: l'affichage reste figé sur cette
  // valeur au lieu de continuer à grimper.
  const elapsedSec = Math.min(elapsedMs / 1000, absoluteEndSec(speech))
  const state = resolvePhase(speech, elapsedSec, cues)
  const started = running || elapsedSec > 0

  useThemeColor(started ? resolveColor(state) : PHASE_COLORS.idle)
  const flashToken = useSignalAlerts(state, running, preferences)

  useEffect(() => {
    reset()
  }, [index, reset])

  useEffect(() => {
    if (state.phase === 'ended' && running) pause()
  }, [state.phase, running, pause])

  useEffect(() => {
    if (!running) {
      void releaseWakeLock()
      return
    }
    void requestWakeLock()
    // Le verrou est relâché par le navigateur dès que l'onglet passe en
    // arrière-plan, il faut donc le redemander au retour.
    const reacquire = () => {
      if (document.visibilityState === 'visible') void requestWakeLock()
    }
    document.addEventListener('visibilitychange', reacquire)
    return () => {
      document.removeEventListener('visibilitychange', reacquire)
      void releaseWakeLock()
    }
  }, [running])

  const isLast = index === schedule.length - 1
  const ended = state.phase === 'ended'

  const togglePreference = (key: keyof AlertPreferences) => {
    const next = { ...preferences, [key]: !preferences[key] }
    onPreferencesChange(next)
    saveAlertPreferences(next)
    if (next.sound) unlockAudio()
  }

  const goNext = () => {
    if (isLast) onBackToSetup()
    else onSelect(index + 1)
  }

  const onPrimary = () => {
    unlockAudio()
    playAlert('click', preferences)
    if (ended) goNext()
    else if (running) pause()
    else start()
  }

  const primaryLabel = ended
    ? isLast
      ? 'Terminer'
      : 'Suivant'
    : running
      ? 'Pause'
      : elapsedSec > 0
        ? 'Reprendre'
        : 'Démarrer'

  return (
    <div className="mx-auto w-full max-w-[30rem] px-4 pb-12">
      {preferences.flash && flashToken > 0 && (
        <div key={flashToken} className="cue-flash" />
      )}

      <header className="flex items-center justify-between py-3">
        <BrandHeader />
        <span className="flex gap-1.5">
          <button
            type="button"
            className="icon-button"
            onClick={onBackToSetup}
            title="Choix des temps"
            aria-label="Revenir au choix des temps"
          >
            {SettingsIcon}
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => togglePreference('sound')}
            aria-pressed={preferences.sound}
            title={preferences.sound ? 'Couper le son' : 'Activer le son'}
            aria-label={preferences.sound ? 'Couper le son' : 'Activer le son'}
          >
            <SoundIcon on={preferences.sound} />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => togglePreference('vibration')}
            aria-pressed={preferences.vibration}
            title={
              preferences.vibration
                ? 'Couper la vibration'
                : 'Activer la vibration'
            }
            aria-label={
              preferences.vibration
                ? 'Couper la vibration'
                : 'Activer la vibration'
            }
          >
            <VibrationIcon on={preferences.vibration} />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => togglePreference('flash')}
            aria-pressed={preferences.flash}
            title={
              preferences.flash
                ? 'Couper les flashs visuels'
                : 'Activer les flashs visuels'
            }
            aria-label={
              preferences.flash
                ? 'Couper les flashs visuels'
                : 'Activer les flashs visuels'
            }
          >
            <FlashIcon on={preferences.flash} />
          </button>
        </span>
      </header>

      <div className="card px-4 pt-4 pb-5 sm:px-6">
        <SpeechTabs schedule={schedule} index={index} onSelect={onSelect} />

        <h1 className="mt-3 text-center text-base font-bold sm:text-lg">
          {speech.title}
        </h1>

        <SignalStage state={state} elapsedSec={elapsedSec} />

        <div className="mt-3">
          <SpeechProgress speech={speech} elapsedSec={elapsedSec} />
        </div>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            className="icon-button"
            onClick={reset}
            disabled={elapsedSec === 0}
            title="Remettre à zéro"
            aria-label="Remettre le discours à zéro"
          >
            {ResetIcon}
          </button>
          <button
            type="button"
            className="push-button"
            data-pressed={running}
            onClick={onPrimary}
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={goNext}
            disabled={ended}
            title={isLast ? 'Terminer la ronde' : 'Discours suivant'}
            aria-label={isLast ? 'Terminer la ronde' : 'Discours suivant'}
          >
            {NextIcon}
          </button>
        </div>
      </div>
    </div>
  )
}
