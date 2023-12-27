import { Player, Room } from '@prisma/client'

export type Game = {
  room: Room | null
  players: Player[]
}

export enum Rank {
  Fold = -1,
  HighCard,
  OnePair,
  TwoPair,
  ThreeOfKind,
  Straight,
  Flush,
  FullHouse,
  FourOfKind,
  StraightFlush,
  RoyalFlush
}

export enum CardValue {
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
  Jack = 11,
  Queen = 12,
  King = 13,
  Ace = 14
}
export enum CardSuit {
  Spade,
  Club,
  Diamond,
  Heart
}

export type Card = {
  value: CardValue
  suit: CardSuit
}
