/**
 * Structure d'une ronde de débat parlementaire canadien selon le guide du débat
 * de la LiDUC (section 1 « Structure et rôles » et section 6 « Point d'information »).
 *
 * Le gouvernement et l'opposition choisissent leur format indépendamment, ce qui
 * donne quatre combinaisons. Chaque équipe totalise toujours 17 minutes.
 */

export type TimeType = 'standard' | 'allonge'

export type Side = 'gov' | 'opp'

export interface Speech {
  id: string
  /** Nom du discours, ex. « Ouverture du gouvernement ». */
  title: string
  /** Oratrice ou orateur, ex. « Première ministre ». */
  speaker: string
  /** Abréviation du rôle, ex. « PM ». */
  speakerShort: string
  side: Side
  durationSec: number
  /**
   * Bornes de la fenêtre où les points d'information sont permis, en secondes
   * depuis le début du discours. Toutes deux absentes pour un discours
   * entièrement protégé (les clôtures).
   */
  poiStartSec?: number
  poiEndSec?: number
}

export interface RoundSettings {
  gov: TimeType
  opp: TimeType
}

/** Durée du sursis accordé après la fin du temps de parole, avant la fin absolue. */
export const GRACE_SEC = 15

/** Durée du compte à rebours aux doigts, en fin de discours. */
export const COUNTDOWN_SEC = 10

/** Moment du « C » d'une main, exprimé en secondes restantes. */
export const C_SIGN_REMAINING_SEC = 30

const MIN = 60

/** Fenêtre de POI d'un discours de 7 minutes: 1 minute protégée de chaque côté. */
const SEVEN_MIN_SPEECH = {
  durationSec: 7 * MIN,
  poiStartSec: 1 * MIN,
  poiEndSec: 6 * MIN,
} as const

export function buildSchedule({ gov, opp }: RoundSettings): Speech[] {
  const speeches: Speech[] = []

  // Ouverture du gouvernement. En temps standard, c'est le seul discours où
  // seulement 30 secondes sont protégées de part et d'autre.
  speeches.push(
    gov === 'standard'
      ? {
          id: 'gov-opening',
          title: 'Ouverture du gouvernement',
          speaker: 'Première ministre',
          speakerShort: 'PM',
          side: 'gov',
          durationSec: 6 * MIN,
          poiStartSec: 30,
          poiEndSec: 5 * MIN + 30,
        }
      : {
          id: 'gov-opening',
          title: 'Ouverture du gouvernement',
          speaker: 'Première ministre',
          speakerShort: 'PM',
          side: 'gov',
          ...SEVEN_MIN_SPEECH,
        },
  )

  // Ouverture de l'opposition: la CO en temps standard, le MO en temps allongé.
  speeches.push({
    id: 'opp-opening',
    title: "Ouverture de l'opposition",
    speaker:
      opp === 'standard' ? "Cheffe de l'opposition" : "Membre de l'opposition",
    speakerShort: opp === 'standard' ? 'CO' : 'MO',
    side: 'opp',
    ...SEVEN_MIN_SPEECH,
  })

  speeches.push({
    id: 'gov-response',
    title: 'Réponse du gouvernement',
    speaker: 'Ministre de la Couronne',
    speakerShort: 'MC',
    side: 'gov',
    ...SEVEN_MIN_SPEECH,
  })

  // Réponse de l'opposition. En temps allongé, la CO fait un seul discours de
  // 10 minutes dont les 4 dernières minutes sont protégées.
  speeches.push(
    opp === 'standard'
      ? {
          id: 'opp-response',
          title: "Réponse de l'opposition",
          speaker: "Membre de l'opposition",
          speakerShort: 'MO',
          side: 'opp',
          ...SEVEN_MIN_SPEECH,
        }
      : {
          id: 'opp-response',
          title: "Réponse et clôture de l'opposition",
          speaker: "Cheffe de l'opposition",
          speakerShort: 'CO',
          side: 'opp',
          durationSec: 10 * MIN,
          poiStartSec: 1 * MIN,
          poiEndSec: 6 * MIN,
        },
  )

  // La clôture de l'opposition n'existe qu'en temps standard, et est
  // entièrement protégée.
  if (opp === 'standard') {
    speeches.push({
      id: 'opp-closing',
      title: "Clôture de l'opposition",
      speaker: "Cheffe de l'opposition",
      speakerShort: 'CO',
      side: 'opp',
      durationSec: 3 * MIN,
    })
  }

  speeches.push({
    id: 'gov-closing',
    title: 'Clôture du gouvernement',
    speaker: 'Première ministre',
    speakerShort: 'PM',
    side: 'gov',
    durationSec: gov === 'standard' ? 4 * MIN : 3 * MIN,
  })

  return speeches
}

/** Temps de parole total d'une équipe dans un horaire donné, en secondes. */
export function totalTimeForSide(speeches: Speech[], side: Side): number {
  return speeches
    .filter((speech) => speech.side === side)
    .reduce((total, speech) => total + speech.durationSec, 0)
}

export function isFullyProtected(speech: Speech): boolean {
  return speech.poiStartSec === undefined || speech.poiEndSec === undefined
}

export function formatDuration(totalSec: number): string {
  const sign = totalSec < 0 ? '-' : ''
  const abs = Math.abs(Math.trunc(totalSec))
  const minutes = Math.floor(abs / 60)
  const seconds = abs % 60
  return `${sign}${minutes}:${String(seconds).padStart(2, '0')}`
}

export const TIME_TYPE_LABELS: Record<Side, Record<TimeType, string>> = {
  gov: {
    standard: 'Temps standard',
    allonge: 'Temps allongé',
  },
  opp: {
    standard: 'Temps standard',
    allonge: 'Temps allongé',
  },
}
