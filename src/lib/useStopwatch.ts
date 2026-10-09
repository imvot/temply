import { useCallback, useEffect, useRef, useState } from 'react'

export interface Stopwatch {
  elapsedMs: number
  running: boolean
  start: () => void
  pause: () => void
  reset: () => void
}

/**
 * Chronomètre croissant ancré sur l'horloge système plutôt que sur une
 * accumulation d'intervalles: sur téléphone, un onglet en arrière-plan voit ses
 * minuteries fortement ralenties, mais l'écart entre deux lectures de
 * `Date.now()` reste exact.
 */
export function useStopwatch(): Stopwatch {
  const [elapsedMs, setElapsedMs] = useState(0)
  const [running, setRunning] = useState(false)
  /** Instant du dernier démarrage, ou null si en pause. */
  const startedAtRef = useRef<number | null>(null)
  /** Temps cumulé avant le démarrage courant. */
  const accumulatedRef = useRef(0)

  const readElapsed = useCallback(() => {
    const startedAt = startedAtRef.current
    if (startedAt === null) return accumulatedRef.current
    // Un recul de l'horloge système, par exemple une correction NTP ou un
    // changement d'heure, ne doit pas faire reculer le chrono.
    return accumulatedRef.current + Math.max(0, Date.now() - startedAt)
  }, [])

  useEffect(() => {
    if (!running) return

    let frame = 0
    const tick = () => {
      setElapsedMs(readElapsed())
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, readElapsed])

  // requestAnimationFrame ne s'exécute pas dans un onglet caché. Au retour, on
  // recalcule immédiatement pour éviter d'afficher une valeur périmée le temps
  // d'une frame.
  useEffect(() => {
    const resync = () => setElapsedMs(readElapsed())
    document.addEventListener('visibilitychange', resync)
    return () => document.removeEventListener('visibilitychange', resync)
  }, [readElapsed])

  const start = useCallback(() => {
    if (startedAtRef.current !== null) return
    startedAtRef.current = Date.now()
    setRunning(true)
  }, [])

  const pause = useCallback(() => {
    if (startedAtRef.current === null) return
    accumulatedRef.current = readElapsed()
    startedAtRef.current = null
    setElapsedMs(accumulatedRef.current)
    setRunning(false)
  }, [readElapsed])

  const reset = useCallback(() => {
    startedAtRef.current = null
    accumulatedRef.current = 0
    setElapsedMs(0)
    setRunning(false)
  }, [])

  return { elapsedMs, running, start, pause, reset }
}
