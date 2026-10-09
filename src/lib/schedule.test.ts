import { describe, expect, it } from 'vitest'
import {
  buildSchedule,
  formatDuration,
  isFullyProtected,
  totalTimeForSide,
  type RoundSettings,
  type TimeType,
} from './schedule'

const COMBINATIONS: RoundSettings[] = [
  { gov: 'standard', opp: 'standard' },
  { gov: 'standard', opp: 'allonge' },
  { gov: 'allonge', opp: 'standard' },
  { gov: 'allonge', opp: 'allonge' },
]

describe('buildSchedule', () => {
  it.each(COMBINATIONS)(
    'donne 17 minutes à chaque équipe (gouvernement $gov, opposition $opp)',
    (settings) => {
      const schedule = buildSchedule(settings)
      expect(totalTimeForSide(schedule, 'gov')).toBe(17 * 60)
      expect(totalTimeForSide(schedule, 'opp')).toBe(17 * 60)
    },
  )

  it.each(COMBINATIONS)(
    'alterne gouvernement et opposition (gouvernement $gov, opposition $opp)',
    (settings) => {
      const sides = buildSchedule(settings).map((speech) => speech.side)
      expect(sides.slice(0, 4)).toEqual(['gov', 'opp', 'gov', 'opp'])
      expect(sides.at(-1)).toBe('gov')
    },
  )

  it('reproduit le tableau du temps standard', () => {
    const schedule = buildSchedule({ gov: 'standard', opp: 'standard' })
    expect(
      schedule.map((speech) => [
        speech.title,
        speech.speakerShort,
        speech.durationSec,
      ]),
    ).toEqual([
      ['Ouverture du gouvernement', 'PM', 360],
      ["Ouverture de l'opposition", 'CO', 420],
      ['Réponse du gouvernement', 'MC', 420],
      ["Réponse de l'opposition", 'MO', 420],
      ["Clôture de l'opposition", 'CO', 180],
      ['Clôture du gouvernement', 'PM', 240],
    ])
  })

  it('reproduit le tableau du temps allongé', () => {
    const schedule = buildSchedule({ gov: 'allonge', opp: 'allonge' })
    expect(
      schedule.map((speech) => [
        speech.title,
        speech.speakerShort,
        speech.durationSec,
      ]),
    ).toEqual([
      ['Ouverture du gouvernement', 'PM', 420],
      ["Ouverture de l'opposition", 'MO', 420],
      ['Réponse du gouvernement', 'MC', 420],
      ["Réponse et clôture de l'opposition", 'CO', 600],
      ['Clôture du gouvernement', 'PM', 180],
    ])
  })

  it("n'a pas de clôture séparée de l'opposition en temps allongé", () => {
    const ids = buildSchedule({ gov: 'standard', opp: 'allonge' }).map(
      (speech) => speech.id,
    )
    expect(ids).not.toContain('opp-closing')
    expect(ids).toHaveLength(5)
  })

  it('protège 30 secondes seulement pour l\u2019ouverture du PM en temps standard', () => {
    const [opening] = buildSchedule({ gov: 'standard', opp: 'standard' })
    expect(opening.poiStartSec).toBe(30)
    expect(opening.poiEndSec).toBe(330)
  })

  it.each<TimeType>(['standard', 'allonge'])(
    'ouvre les POI de 1:00 à 6:00 pour les discours de 7 minutes (opposition %s)',
    (opp) => {
      const schedule = buildSchedule({ gov: 'allonge', opp })
      const sevenMinute = schedule.filter(
        (speech) => speech.durationSec === 420,
      )
      expect(sevenMinute).not.toHaveLength(0)
      for (const speech of sevenMinute) {
        expect(speech.poiStartSec).toBe(60)
        expect(speech.poiEndSec).toBe(360)
      }
    },
  )

  it('protège les 4 dernières minutes du discours de 10 minutes de la CO', () => {
    const schedule = buildSchedule({ gov: 'standard', opp: 'allonge' })
    const response = schedule.find((speech) => speech.id === 'opp-response')
    expect(response).toMatchObject({
      durationSec: 600,
      poiStartSec: 60,
      poiEndSec: 360,
      speakerShort: 'CO',
    })
  })

  it.each(COMBINATIONS)(
    'rend les clôtures entièrement protégées (gouvernement $gov, opposition $opp)',
    (settings) => {
      const closings = buildSchedule(settings).filter((speech) =>
        speech.id.endsWith('-closing'),
      )
      for (const closing of closings) {
        expect(isFullyProtected(closing)).toBe(true)
      }
    },
  )

  it.each(COMBINATIONS)(
    'laisse les autres discours ouverts aux POI (gouvernement $gov, opposition $opp)',
    (settings) => {
      const open = buildSchedule(settings).filter(
        (speech) => !speech.id.endsWith('-closing'),
      )
      for (const speech of open) {
        expect(isFullyProtected(speech)).toBe(false)
      }
    },
  )

  it('ajuste la clôture du gouvernement selon son format', () => {
    const standard = buildSchedule({ gov: 'standard', opp: 'standard' })
    const allonge = buildSchedule({ gov: 'allonge', opp: 'standard' })
    expect(standard.at(-1)?.durationSec).toBe(240)
    expect(allonge.at(-1)?.durationSec).toBe(180)
  })
})

describe('formatDuration', () => {
  it('formate en minutes et secondes', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(9)).toBe('0:09')
    expect(formatDuration(330)).toBe('5:30')
    expect(formatDuration(600)).toBe('10:00')
  })

  it('préfixe les valeurs négatives', () => {
    expect(formatDuration(-5)).toBe('-0:05')
    expect(formatDuration(-75)).toBe('-1:15')
  })
})
