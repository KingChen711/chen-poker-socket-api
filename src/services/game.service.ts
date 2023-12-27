import { PrismaClient } from '@prisma/client'
import { playerService } from './player.service'
import { io } from '..'
import { StartGameParams } from '~/helpers/params'
import { BigBlindValue, InitialBalance, SmallBlindValue, deck } from '~/helpers/constants'
import { drawCard } from '~/helpers/game'
import { Game } from '~/types'

const prisma = new PrismaClient()

const getGameByRoomId = async (id: string): Promise<Game | null> => {
  const room = await prisma.room.findUnique({
    where: { id }
  })

  const players = await playerService.getPlayersWithUserByRoomId({ roomId: id })

  return { room, players }
}

const emitGameChangeByRoomId = async (id: string) => {
  const game = await getGameByRoomId(id)
  if (game?.room) {
    io.to(game.room.id).emit('room-change', game.room)
    if (game?.players) {
      io.to(game.room.id).emit('players-change', game.players)
    }
  }
}

const startGame = async ({ roomId }: StartGameParams) => {
  const players = await playerService.getPlayersWithUserByRoomId({ roomId })

  if (players.length < 2) {
    throw new Error('At least 2 players to start a game!')
  }

  const gameObj = {
    dealerIndex: 0,
    turn: 3, // turn of the player next to the big house
    callingValue: BigBlindValue,
    dealer: players[0 % players.length].userId,
    smallBlind: players[1 % players.length].userId,
    bigBlind: players[2 % players.length].userId,
    communityCards: [],
    deck: [...deck],
    allInPlayers: [],
    checkingPlayers: [],
    foldPlayers: [],
    readyPlayers: [],
    winner: null
  }

  const updatePlayersPromises = players.map((p) => {
    return prisma.player.update({
      where: { id: p.id },
      data: {
        hand: { holeCards: drawCard(gameObj.deck, 2), pokerCards: [], rank: null },
        balance:
          p.userId === gameObj.smallBlind
            ? InitialBalance - SmallBlindValue
            : p.userId === gameObj.bigBlind
              ? InitialBalance - BigBlindValue
              : InitialBalance,
        bet: p.userId === gameObj.smallBlind ? SmallBlindValue : p.userId === gameObj.bigBlind ? BigBlindValue : 0
      }
    })
  })

  const updateRoomPromises = prisma.room.update({
    where: { id: roomId },
    data: {
      status: 'PRE_FLOP',
      gameObj
    }
  })

  await Promise.all([...updatePlayersPromises, updateRoomPromises])

  await emitGameChangeByRoomId(roomId)
}

const gameService = { getGameByRoomId, emitGameChangeByRoomId, startGame }

export { gameService }
