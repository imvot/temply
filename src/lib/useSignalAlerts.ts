import { useEffect, useRef, useState } from 'react'
import { playAlert, type AlertKind, type AlertPreferences } from './alerts'
import type { PhaseState } from './cues'

/**
 * Déclenche une alerte à chaque transition et renvoie un jeton qui s'incrémente
 * sur chaque signe digne d'un flash. Le chronomètre se met à jour à chaque
 * frame, donc les effets sont déclenchés sur des valeurs discrètes (identité du
 * signe, chiffre du compte à rebours, phase) plutôt que sur l'état complet, qui
 * change en continu.
 */
export function useSignalAlerts(
  state: PhaseState,
  enabled: boolean,
  preferences: AlertPreferences,
): number {
  const preferencesRef = useRef(preferences)
  preferencesRef.current = preferences
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled
  const [flashToken, setFlashToken] = useState(0)

  const cueKey = state.activeCue
    ? `${state.activeCue.kind}@${state.activeCue.atSec}`
    : null
  const digit = state.countdownDigit ?? null
  const { phase } = state

  useEffect(() => {
    if (!cueKey || !enabledRef.current) return
    playAlert(cueKey.split('@')[0] as AlertKind, preferencesRef.current)
    setFlashToken((token) => token + 1)
  }, [cueKey])

  useEffect(() => {
    if (digit === null || !enabledRef.current) return
    playAlert('countdown', preferencesRef.current)
  }, [digit])

  useEffect(() => {
    if (!enabledRef.current) return
    if (phase === 'grace') playAlert('grace', preferencesRef.current)
    if (phase === 'ended') playAlert('end', preferencesRef.current)
    // Un flash par seconde du compte à rebours serait un stroboscope: on n'en
    // émet qu'un seul à son entrée.
    if (phase === 'countdown' || phase === 'grace' || phase === 'ended') {
      setFlashToken((token) => token + 1)
    }
  }, [phase])

  return flashToken
}
