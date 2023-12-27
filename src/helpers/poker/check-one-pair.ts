import { Rank } from '~/types'
import { handToSecondBitField } from './convert'
import { compareCard } from './compare'
import { Hand } from '@prisma/client'

type AmountOfValue = {
  [key: string]: number
}

export function checkOnePair(hand: Hand) {
  const bitField = handToSecondBitField(hand)
  const rest = Number(bitField % BigInt(15))

  // *rest = 8 (sure 1 pair)
  const noValidRest = rest !== 8
  if (noValidRest) {
    return false
  }

  // now, this hand is sure 1 pair, let's find the rank and cards
  const amountOfValue: AmountOfValue = {}
  for (const card of hand.holeCards) {
    const key = card.value.valueOf().toString()
    amountOfValue[key] = amountOfValue[key] ? amountOfValue[key] + 1 : 1
  }

  let pairValue = 0
  for (const [value, amount] of Object.entries(amountOfValue)) {
    if (amount === 2) {
      pairValue = Number(value)
      break
    }
  }

  const pairCards = hand?.holeCards.filter((card) => card.value.valueOf() === pairValue)
  const lastCards = hand?.holeCards
    .filter((card) => card.value.valueOf() !== pairValue)
    .sort(compareCard)
    .slice(0, 3)

  return {
    pokerCards: [...pairCards, ...lastCards],
    rank: Rank.OnePair
  }
}
