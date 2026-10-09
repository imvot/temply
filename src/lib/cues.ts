/**
 * Dérivation des signes de main à partir d'un discours.
 *
 * Évènements ponctuels (une tape de paume, un « C ») et phases continues
 * (compte à rebours aux doigts, secondes de grâce) sont traités séparément:
 * un évènement ponctuel s'affiche quelques secondes puis disparaît, alors
 * qu'une phase occupe l'affichage tant qu'elle dure.
 */

import {
  COUNTDOWN_SEC,
  C_SIGN_REMAINING_SEC,
  GRACE_SEC,
  isFullyProtected,
  type Speech,
} from './schedule'

export type CueKind = 'poi-start' | 'poi-end' | 'c-sign'

export interface Cue {
  kind: CueKind
  atSec: number
  /** Geste à faire, affiché en gros. */
  gesture: string
  /** Ce que le geste signifie. */
  meaning: string
}

export type Phase =
  | 'idle'
  | 'protected-start'
  | 'poi-open'
  | 'protected-end'
  | 'countdown'
  | 'grace'
  | 'ended'

export interface PhaseState {
  phase: Phase
  /** Secondes restantes avant la fin du temps de parole, négatif en grâce. */
  remainingSec: number
  /** Chiffre à montrer aux doigts pendant les 10 dernières secondes. */
  countdownDigit?: number
  /** Secondes écoulées dans le sursis, pour l'aiguille des deux bras. */
  graceElapsedSec?: number
  /** Évènement ponctuel actif, s'il y en a un. */
  activeCue?: Cue
  /** Prochain évènement ponctuel à venir. */
  nextCue?: Cue
}

/** Durée d'affichage d'un évènement ponctuel, en secondes. */
export const CUE_DISPLAY_SEC = 10

export function buildCues(speech: Speech): Cue[] {
  const cues: Cue[] = []
  const { poiStartSec, poiEndSec, durationSec } = speech

  if (!isFullyProtected(speech)) {
    cues.push({
      kind: 'poi-start',
      atSec: poiStartSec as number,
      gesture: 'Tape de paume sur la table',
      meaning: 'Début des points d\u2019information',
    })
    cues.push({
      kind: 'poi-end',
      atSec: poiEndSec as number,
      gesture: 'Tape de paume sur la table',
      meaning: 'Fin des points d\u2019information',
    })
  }

  // Le « C » annonce les 30 dernières secondes, sauf lorsqu'il tombe exactement
  // sur une tape de paume: dans ce cas seule la tape est faite. C'est le cas de
  // l'ouverture du PM en temps standard, où 5:30 est à la fois la fin des POI et
  // les 30 secondes restantes.
  const cSignAt = durationSec - C_SIGN_REMAINING_SEC
  const collidesWithTap = cues.some((cue) => cue.atSec === cSignAt)
  if (!collidesWithTap) {
    cues.push({
      kind: 'c-sign',
      atSec: cSignAt,
      gesture: '« C » d\u2019une main',
      meaning: '30 secondes restantes',
    })
  }

  return cues.sort((a, b) => a.atSec - b.atSec)
}

export function resolvePhase(
  speech: Speech,
  elapsedSec: number,
  cues: Cue[] = buildCues(speech),
): PhaseState {
  const { durationSec } = speech
  const remainingSec = durationSec - elapsedSec
  const absoluteEndSec = durationSec + GRACE_SEC

  const activeCue = [...cues]
    .reverse()
    .find(
      (cue) =>
        elapsedSec >= cue.atSec && elapsedSec < cue.atSec + CUE_DISPLAY_SEC,
    )
  const nextCue = cues.find((cue) => cue.atSec > elapsedSec)

  if (elapsedSec >= absoluteEndSec) {
    return { phase: 'ended', remainingSec, nextCue }
  }

  if (elapsedSec >= durationSec) {
    return {
      phase: 'grace',
      remainingSec,
      graceElapsedSec: elapsedSec - durationSec,
      nextCue,
    }
  }

  if (remainingSec <= COUNTDOWN_SEC) {
    return {
      phase: 'countdown',
      remainingSec,
      // Un chiffre reste affiché pendant toute sa seconde: à 9.4 s restantes,
      // on montre encore 10.
      countdownDigit: Math.max(1, Math.ceil(remainingSec)),
      nextCue,
    }
  }

  if (isFullyProtected(speech)) {
    return { phase: 'protected-start', remainingSec, activeCue, nextCue }
  }

  if (elapsedSec < (speech.poiStartSec as number)) {
    return { phase: 'protected-start', remainingSec, activeCue, nextCue }
  }

  if (elapsedSec < (speech.poiEndSec as number)) {
    return { phase: 'poi-open', remainingSec, activeCue, nextCue }
  }

  return { phase: 'protected-end', remainingSec, activeCue, nextCue }
}

export function absoluteEndSec(speech: Speech): number {
  return speech.durationSec + GRACE_SEC
}

export const PHASE_LABELS: Record<Phase, string> = {
  idle: 'En attente',
  'protected-start': 'Temps protégé',
  'poi-open': 'Points d\u2019information ouverts',
  'protected-end': 'Temps protégé',
  countdown: '10 dernières secondes',
  grace: 'Secondes de grâce',
  ended: 'Fin absolue du tour de parole',
}

/**
 * Couleur de fond au repos. Le temps protégé garde la même teinte neutre avant
 * et après la fenêtre de POI, parce qu'il s'agit du même état: rien à signaler.
 */
export const PHASE_COLORS: Record<Phase, string> = {
  idle: '#3e4a5a',
  'protected-start': '#3e4a5a',
  'poi-open': '#3a7d5c',
  'protected-end': '#3e4a5a',
  countdown: '#c2612f',
  grace: '#a8322f',
  ended: '#262a31',
}

/**
 * Couleur propre au geste, qui prend le dessus pendant l'affichage du signe.
 * Les deux tapes partagent la même teinte puisque c'est le même geste.
 */
export const CUE_COLORS: Record<CueKind, string> = {
  'poi-start': '#2f6f9f',
  'poi-end': '#2f6f9f',
  'c-sign': '#b8862b',
}

export function resolveColor(state: PhaseState): string {
  return state.activeCue
    ? CUE_COLORS[state.activeCue.kind]
    : PHASE_COLORS[state.phase]
}
