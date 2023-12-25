import { Card } from '~/types'

export function drawCard(deck: Card[], numberOfCards: number): Card[] {
  // Check if the deck has enough cards
  if (numberOfCards > deck.length) {
    throw new Error('Not enough cards in the deck')
  }

  // Shuffle the deck to get a random order of cards
  const shuffledDeck = shuffleDeck(deck)

  // Draw the specified number of cards from the shuffled deck
  const drawnCards = shuffledDeck.splice(0, numberOfCards)

  return drawnCards
}

function shuffleDeck(deck: Card[]): Card[] {
  // Implementation of Fisher-Yates shuffle algorithm
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }

  return deck
}
