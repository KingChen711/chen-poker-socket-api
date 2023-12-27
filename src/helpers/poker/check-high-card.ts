import { Rank } from '~/types'
import { compareCard } from './compare'
import { Hand } from '@prisma/client'

export function checkHighCard(hand: Hand) {
  return {
    pokerCards: hand?.holeCards.sort(compareCard).slice(0, 5),
    rank: Rank.HighCard
  }
}
