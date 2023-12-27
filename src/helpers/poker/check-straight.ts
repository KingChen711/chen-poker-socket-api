import { Rank } from '~/types'
import { handToFirstBitField } from './convert'
import { compareCard } from './compare'
import { Card, Hand } from '@prisma/client'

export function checkStraight(hand: Hand) {
  const cards = hand?.holeCards as Card[]
  const bitField = handToFirstBitField(hand)
  const formattedBinary = bitField.toString(2).padStart(15, '0')

  const hasStraight5 = formattedBinary.includes('11111')
  if (!hasStraight5) {
    return false
  }

  let biggestValue = 14 - formattedBinary.indexOf('11111')

  const setCard = []
  for (const card of cards.sort(compareCard)) {
    if (card.value.valueOf() === biggestValue) {
      setCard.push(card)
      biggestValue--
    }
  }

  return {
    pokerCards: setCard.slice(0, 5),
    rank: Rank.Straight
  }
}
