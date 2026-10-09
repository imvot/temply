import { describe, expect, it } from 'vitest'
import { absoluteEndSec, buildCues, resolvePhase } from './cues'
import { buildSchedule, type Speech } from './schedule'

function speechById(
  settings: Parameters<typeof buildSchedule>[0],
  id: string,
): Speech {
  const speech = buildSchedule(settings).find((item) => item.id === id)
  if (!speech) throw new Error(`Discours introuvable: ${id}`)
  return speech
}

const pmOpeningStandard = speechById(
  { gov: 'standard', opp: 'standard' },
  'gov-opening',
)
const pmOpeningAllonge = speechById(
  { gov: 'allonge', opp: 'standard' },
  'gov-opening',
)
const coResponseAllonge = speechById(
  { gov: 'standard', opp: 'allonge' },
  'opp-response',
)
const pmClosingStandard = speechById(
  { gov: 'standard', opp: 'standard' },
  'gov-closing',
)

describe('buildCues', () => {
  it('supprime le « C » pour l\u2019ouverture du PM en temps standard', () => {
    const cues = buildCues(pmOpeningStandard)
    expect(cues.map((cue) => [cue.kind, cue.atSec])).toEqual([
      ['poi-start', 30],
      ['poi-end', 330],
    ])
    expect(cues.some((cue) => cue.kind === 'c-sign')).toBe(false)
  })

  it('garde le « C » pour un discours de 7 minutes', () => {
    expect(buildCues(pmOpeningAllonge).map((cue) => [cue.kind, cue.atSec])).toEqual(
      [
        ['poi-start', 60],
        ['poi-end', 360],
        ['c-sign', 390],
      ],
    )
  })

  it('place le « C » à 9:30 pour le discours de 10 minutes de la CO', () => {
    expect(buildCues(coResponseAllonge).map((cue) => [cue.kind, cue.atSec])).toEqual(
      [
        ['poi-start', 60],
        ['poi-end', 360],
        ['c-sign', 570],
      ],
    )
  })

  it('ne garde que le « C » pour une clôture entièrement protégée', () => {
    expect(buildCues(pmClosingStandard).map((cue) => [cue.kind, cue.atSec])).toEqual(
      [['c-sign', 210]],
    )
  })

  it('retourne les signes en ordre chronologique', () => {
    for (const settings of [
      { gov: 'standard', opp: 'standard' },
      { gov: 'standard', opp: 'allonge' },
      { gov: 'allonge', opp: 'standard' },
      { gov: 'allonge', opp: 'allonge' },
    ] as const) {
      for (const speech of buildSchedule(settings)) {
        const moments = buildCues(speech).map((cue) => cue.atSec)
        expect([...moments].sort((a, b) => a - b)).toEqual(moments)
      }
    }
  })

  it('place tout signe à l\u2019intérieur du temps de parole', () => {
    for (const speech of buildSchedule({ gov: 'allonge', opp: 'allonge' })) {
      for (const cue of buildCues(speech)) {
        expect(cue.atSec).toBeGreaterThan(0)
        expect(cue.atSec).toBeLessThan(speech.durationSec)
      }
    }
  })
})

describe('resolvePhase', () => {
  it('suit les phases de l\u2019ouverture du PM en temps standard', () => {
    const phaseAt = (sec: number) => resolvePhase(pmOpeningStandard, sec).phase
    expect(phaseAt(0)).toBe('protected-start')
    expect(phaseAt(29)).toBe('protected-start')
    expect(phaseAt(30)).toBe('poi-open')
    expect(phaseAt(329)).toBe('poi-open')
    expect(phaseAt(330)).toBe('protected-end')
    expect(phaseAt(349)).toBe('protected-end')
    expect(phaseAt(350)).toBe('countdown')
    expect(phaseAt(359)).toBe('countdown')
    expect(phaseAt(360)).toBe('grace')
    expect(phaseAt(374)).toBe('grace')
    expect(phaseAt(375)).toBe('ended')
  })

  it('reste protégé du début à la fin d\u2019une clôture', () => {
    const phaseAt = (sec: number) => resolvePhase(pmClosingStandard, sec).phase
    expect(phaseAt(0)).toBe('protected-start')
    expect(phaseAt(200)).toBe('protected-start')
    expect(phaseAt(230)).toBe('countdown')
    expect(phaseAt(240)).toBe('grace')
    expect(phaseAt(255)).toBe('ended')
  })

  it('termine à la durée plus 15 secondes de grâce', () => {
    for (const settings of [
      { gov: 'standard', opp: 'standard' },
      { gov: 'allonge', opp: 'allonge' },
    ] as const) {
      for (const speech of buildSchedule(settings)) {
        const end = absoluteEndSec(speech)
        expect(end).toBe(speech.durationSec + 15)
        expect(resolvePhase(speech, end - 0.1).phase).toBe('grace')
        expect(resolvePhase(speech, end).phase).toBe('ended')
      }
    }
  })

  it('décompte de 10 à 1 pendant les 10 dernières secondes', () => {
    const digits = Array.from({ length: 10 }, (_, index) => {
      const elapsed = pmClosingStandard.durationSec - 10 + index
      return resolvePhase(pmClosingStandard, elapsed).countdownDigit
    })
    expect(digits).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1])
  })

  it('garde le chiffre affiché pendant toute sa seconde', () => {
    const at = (sec: number) =>
      resolvePhase(pmClosingStandard, sec).countdownDigit
    expect(at(230)).toBe(10)
    expect(at(230.6)).toBe(10)
    expect(at(231)).toBe(9)
  })

  it('compte les secondes de grâce écoulées', () => {
    expect(resolvePhase(pmClosingStandard, 240).graceElapsedSec).toBe(0)
    expect(resolvePhase(pmClosingStandard, 247).graceElapsedSec).toBe(7)
  })

  it('expose le temps restant, négatif en grâce', () => {
    expect(resolvePhase(pmClosingStandard, 0).remainingSec).toBe(240)
    expect(resolvePhase(pmClosingStandard, 240).remainingSec).toBe(0)
    expect(resolvePhase(pmClosingStandard, 250).remainingSec).toBe(-10)
  })

  it('active un signe à son moment et le retire après son affichage', () => {
    const at = (sec: number) => resolvePhase(pmOpeningAllonge, sec).activeCue
    expect(at(59)).toBeUndefined()
    expect(at(60)?.kind).toBe('poi-start')
    expect(at(69)?.kind).toBe('poi-start')
    expect(at(70)).toBeUndefined()
  })

  it('annonce le prochain signe', () => {
    const next = (sec: number) => resolvePhase(pmOpeningAllonge, sec).nextCue
    expect(next(0)).toMatchObject({ kind: 'poi-start', atSec: 60 })
    expect(next(60)).toMatchObject({ kind: 'poi-end', atSec: 360 })
    expect(next(360)).toMatchObject({ kind: 'c-sign', atSec: 390 })
    expect(next(390)).toBeUndefined()
  })

  it('laisse le compte à rebours primer sur l\u2019affichage d\u2019un signe', () => {
    const state = resolvePhase(pmClosingStandard, 232)
    expect(state.phase).toBe('countdown')
    expect(state.activeCue).toBeUndefined()
  })
})
