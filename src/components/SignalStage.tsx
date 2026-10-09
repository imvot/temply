import type { ReactNode } from 'react'
import { GRACE_SEC, formatDuration } from '../lib/schedule'
import type { PhaseState } from '../lib/cues'
import { CIcon, ClockIcon, CountdownIcon, StopIcon, TapIcon } from './icons'

interface Signal {
  icon: ReactNode
  caption: string
}

/** Le geste à faire, ou null quand il n'y a rien à signaler. */
function resolveSignal(state: PhaseState): Signal | null {
  if (state.phase === 'countdown') {
    return {
      icon: <CountdownIcon digit={state.countdownDigit as number} />,
      caption: 'Compte à rebours aux doigts',
    }
  }
  if (state.phase === 'grace') {
    return {
      icon: <ClockIcon progress={(state.graceElapsedSec ?? 0) / GRACE_SEC} />,
      caption: 'Aiguille des secondes, deux bras',
    }
  }
  if (state.phase === 'ended') {
    return { icon: StopIcon, caption: 'Fin absolue du tour de parole' }
  }
  if (state.activeCue) {
    return {
      icon: state.activeCue.kind === 'c-sign' ? CIcon : TapIcon,
      caption: state.activeCue.meaning,
    }
  }
  return null
}

/**
 * Le chrono occupe tout le gros plan, jusqu'à ce qu'un geste survienne: son
 * icône passe alors devant et le chrono se replie en dessous, le temps de
 * l'affichage du signe. La hauteur de la scène est figée pour que rien ne
 * bouge autour.
 */
export default function SignalStage({
  state,
  elapsedSec,
}: {
  state: PhaseState
  elapsedSec: number
}) {
  const signal = resolveSignal(state)
  const prominent = signal !== null

  return (
    <div className="relative h-[clamp(13rem,42vw,16rem)]">
      <div
        className="absolute inset-x-0 top-0 flex h-[62%] items-center justify-center transition-all duration-500 ease-out"
        style={{
          opacity: prominent ? 1 : 0,
          transform: `scale(${prominent ? 1 : 0.55})`,
        }}
      >
        {signal?.icon}
      </div>

      <div
        className="tabular absolute inset-x-0 text-center leading-none font-bold transition-all duration-500 ease-out"
        style={{
          top: prominent ? '70%' : '50%',
          transform: 'translateY(-50%)',
          fontSize: prominent
            ? 'clamp(1.75rem, 8vw, 2.5rem)'
            : 'clamp(3.75rem, 22vw, 7rem)',
        }}
      >
        {formatDuration(Math.floor(elapsedSec))}
      </div>

      <div
        className="absolute inset-x-0 bottom-0 text-center text-xs tracking-wide uppercase transition-opacity duration-500"
        style={{ opacity: prominent ? 0.75 : 0 }}
      >
        {signal?.caption}
      </div>
    </div>
  )
}
