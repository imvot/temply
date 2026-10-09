/**
 * Alertes sonores et haptiques accompagnant les signes de main, plus le
 * verrouillage de l'écran pendant un discours.
 */

export type AlertKind =
  | 'poi-start'
  | 'poi-end'
  | 'c-sign'
  | 'countdown'
  | 'grace'
  | 'end'
  | 'click'

interface AlertPattern {
  /** Fréquences successives, en hertz. */
  tones: number[]
  /** Durée de chaque bip, en secondes. */
  toneSec: number
  /** Silence entre deux bips, en secondes. */
  gapSec: number
  /** Motif de vibration passé à navigator.vibrate. */
  vibration: number[]
}

const PATTERNS: Record<AlertKind, AlertPattern> = {
  // Deux coups graves, comme la tape de paume.
  'poi-start': {
    tones: [330, 330],
    toneSec: 0.08,
    gapSec: 0.1,
    vibration: [60, 70, 60],
  },
  'poi-end': {
    tones: [330, 330],
    toneSec: 0.08,
    gapSec: 0.1,
    vibration: [60, 70, 60],
  },
  // Un son clair et isolé pour les 30 secondes restantes.
  'c-sign': { tones: [660], toneSec: 0.22, gapSec: 0, vibration: [140] },
  // Tic discret à chaque seconde du compte à rebours.
  countdown: { tones: [880], toneSec: 0.05, gapSec: 0, vibration: [30] },
  // Alerte montante à l'entrée dans les secondes de grâce.
  grace: {
    tones: [520, 660, 520],
    toneSec: 0.12,
    gapSec: 0.05,
    vibration: [100, 60, 100, 60, 100],
  },
  // Son grave et appuyé pour la fin absolue.
  end: {
    tones: [220, 196],
    toneSec: 0.4,
    gapSec: 0.05,
    vibration: [300, 100, 300],
  },
  // Clic sec du bouton principal.
  click: { tones: [1200], toneSec: 0.03, gapSec: 0, vibration: [15] },
}

const STORAGE_KEY = 'liduc-timer-alerts'

export interface AlertPreferences {
  sound: boolean
  vibration: boolean
  /** Flashs plein écran pour attirer l'œil du juge sur le signe. */
  flash: boolean
}

export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  sound: true,
  vibration: true,
  flash: false,
}

export function loadAlertPreferences(): AlertPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_ALERT_PREFERENCES
    const parsed = JSON.parse(raw) as Partial<AlertPreferences>
    return {
      sound: parsed.sound ?? DEFAULT_ALERT_PREFERENCES.sound,
      vibration: parsed.vibration ?? DEFAULT_ALERT_PREFERENCES.vibration,
      flash: parsed.flash ?? DEFAULT_ALERT_PREFERENCES.flash,
    }
  } catch {
    return DEFAULT_ALERT_PREFERENCES
  }
}

export function saveAlertPreferences(preferences: AlertPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // Mode privé ou stockage plein: on garde simplement le réglage en mémoire.
  }
}

let audioContext: AudioContext | null = null

/**
 * À appeler depuis un geste de l'utilisateur. iOS refuse de produire du son si
 * l'AudioContext n'a pas été créé ou réactivé pendant une interaction.
 */
export function unlockAudio(): void {
  try {
    audioContext ??= new AudioContext()
    if (audioContext.state === 'suspended') void audioContext.resume()
  } catch {
    audioContext = null
  }
}

function playTones(pattern: AlertPattern): void {
  if (!audioContext) return
  const context = audioContext
  let at = context.currentTime
  for (const frequency of pattern.tones) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    // Enveloppe courte pour éviter le claquement d'un démarrage brutal.
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(0.28, at + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + pattern.toneSec)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(at)
    oscillator.stop(at + pattern.toneSec + 0.02)
    at += pattern.toneSec + pattern.gapSec
  }
}

export function playAlert(
  kind: AlertKind,
  preferences: AlertPreferences,
): void {
  const pattern = PATTERNS[kind]
  if (preferences.sound) playTones(pattern)
  if (preferences.vibration && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern.vibration)
  }
}

type WakeLockSentinel = { release: () => Promise<void>; released: boolean }

let wakeLock: WakeLockSentinel | null = null

/** Empêche l'écran du téléphone de s'éteindre pendant un discours. */
export async function requestWakeLock(): Promise<void> {
  const api = (
    navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> }
    }
  ).wakeLock
  if (!api || wakeLock) return
  try {
    wakeLock = await api.request('screen')
  } catch {
    // Non supporté, refusé, ou onglet en arrière-plan: sans conséquence.
  }
}

export async function releaseWakeLock(): Promise<void> {
  if (!wakeLock) return
  const sentinel = wakeLock
  wakeLock = null
  try {
    await sentinel.release()
  } catch {
    // Déjà relâché.
  }
}
