import { Rank } from '~/types'
import { handToSecondBitField } from './convert'
import { compareCard } from './compare'
import { Hand } from '@prisma/client'

type AmountOfValue = {
  [key: string]: number
}

export function checkFullHouse(hand: Hand) {
  const bitField = handToSecondBitField(hand)
  const rest = Number(bitField % BigInt(15))

  // *rest = 12,13,0 ->sure is full house
  const noValidRest = rest !== 12 && rest !== 13 && rest !== 0

  if (noValidRest) {
    return false
  }

  // calculate amount each value
  const amountOfValue: AmountOfValue = {}
  for (const card of hand.holeCards) {
    const key = card.value.valueOf().toString()
    amountOfValue[key] = amountOfValue[key] ? amountOfValue[key] + 1 : 1
  }

  let threeDupValue = 0
  let twoDupValue = 0

  for (const [value, amount] of Object.entries(amountOfValue).sort((a, b) => {
    return Number(b[0]) - Number(a[0])
  })) {
    if (amount === 3) {
      if (!threeDupValue) {
        threeDupValue = Number(value)
        continue
      }
    }
    if (amount >= 2) {
      if (twoDupValue) {
        continue
      }
      twoDupValue = Number(value)
    }
  }

  const cardResult = []
  const cards = hand?.holeCards.sort(compareCard)
  cardResult.push(...cards.filter((card) => card.value.valueOf() === threeDupValue))
  cardResult.push(...cards.filter((card) => card.value.valueOf() === twoDupValue).slice(0, 2))

  return {
    pokerCards: cardResult,
    rank: Rank.FullHouse
  }
}
