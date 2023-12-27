import { GameObj, Player, PrismaClient, Room } from '@prisma/client'
import { playerService } from './player.service'
import { io } from '..'
import { CallBetParams, CheckBetParams, GameChange, StartGameParams, ToNextRoundParams } from '~/helpers/params'
import { BigBlindValue, InitialBalance, SmallBlindValue, deck } from '~/helpers/constants'
import { drawCard } from '~/helpers/game'
import { Game } from '~/types'
import { roomService } from './room.service'
import ApiError from '~/helpers/api-error'
import { StatusCodes } from 'http-status-codes'

const prisma = new PrismaClient()

const getGameByRoomId = async (id: string): Promise<Game | null> => {
  const room = await prisma.room.findUnique({
    where: { id }
  })

  const players = await playerService.getPlayersWithUserByRoomId({ roomId: id })

  return { room, players }
}

const callBet = async ({ roomId, userId }: CallBetParams) => {
  const room = await roomService.getRequiredRoomById(roomId)
  const players = await playerService.getPlayersWithUserByRoomId({ roomId: room.id })

  const callingPlayer = players.find((p) => p.userId === userId)

  if (!callingPlayer) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'This user is not a player of the room.')
  }

  const gameObj = room.gameObj

  if (!gameObj) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Maybe the game is not started')
  }

  const updatedDataCallingPlayer = {
    balance: callingPlayer.balance! - gameObj.callingValue + callingPlayer.bet!,
    bet: gameObj.callingValue
  }

  let updatedDataRoom = {
    gameObj: {
      ...room.gameObj,
      turn: getNextTurn(gameObj, players)
    },
    status: room.status
  } as GameChange

  const playerWhoNeedToCall = players.find(
    (p) =>
      p.userId !== callingPlayer.userId &&
      p.bet! < gameObj.callingValue &&
      !gameObj.foldPlayers.includes(p.userId) &&
      !gameObj.allInPlayers.includes(p.userId)
  )

  if (!playerWhoNeedToCall) {
    updatedDataRoom = toNextRound({ gameChange: updatedDataRoom, players })
  }

  const updateCallingPlayerPromise = prisma.player.update({
    where: { id: callingPlayer.id },
    data: updatedDataCallingPlayer
  })

  const updateRoomPromise = prisma.room.update({
    where: { id: room.id },
    data: updatedDataRoom
  })

  await Promise.all([updateCallingPlayerPromise, updateRoomPromise])
  await gameService.emitGameChangeByRoomId(room.id)
}

const checkBet = async ({ roomId, userId }: CheckBetParams) => {
  const room = await roomService.getRequiredRoomById(roomId)
  const players = await playerService.getPlayersWithUserByRoomId({ roomId: room.id })

  const checkingPlayer = players.find((p) => p.userId === userId)

  if (!checkingPlayer) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'This user is not a player of the room.')
  }

  const gameObj = room.gameObj

  if (!gameObj) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Maybe the game is not started')
  }

  let updatedDataRoom = {
    gameObj: {
      ...room.gameObj,
      checkingPlayers: [...gameObj.checkingPlayers, userId],
      turn: getNextTurn(gameObj, players)
    },
    status: room.status
  } as GameChange

  // add one for the checking player
  const conditionEndRound =
    gameObj.checkingPlayers.length + 1 + gameObj.foldPlayers.length + gameObj.allInPlayers.length === players.length

  if (conditionEndRound) {
    updatedDataRoom = toNextRound({ gameChange: updatedDataRoom, players })
  }

  await prisma.room.update({
    where: { id: room.id },
    data: updatedDataRoom
  })

  await gameService.emitGameChangeByRoomId(room.id)
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

export function getNextTurn(gameObj: GameObj, players: Player[]) {
  let turnInCreaseAmount = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const index = (gameObj.turn + turnInCreaseAmount) % players.length
    const nextPlayer = players[index].userId

    const isValidNextUser = !gameObj.foldPlayers.includes(nextPlayer) && !gameObj.allInPlayers.includes(nextPlayer)
    if (!isValidNextUser) {
      turnInCreaseAmount++
      continue
    }
    break
  }
  return turnInCreaseAmount + gameObj.turn
}

export function toNextRound({ gameChange, players }: ToNextRoundParams): GameChange {
  if (gameChange.status === 'PRE_FLOP') {
    return toTheFlop({ gameChange, players })
  }

  if (gameChange.status === 'THE_FLOP' || gameChange.status === 'THE_TURN') {
    return toTheTurnOrRiver({ gameChange, players })
  }

  if (gameChange.status === 'THE_RIVER') {
    return toShowDown({ gameChange, players })
  }

  return gameChange //not-aspects
}

export function toTheFlop({ gameChange, players }: ToNextRoundParams): GameChange {
  gameChange.status = 'THE_FLOP'
  gameChange.gameObj.turn = gameChange.gameObj.dealerIndex // set current turn is for dealer
  gameChange.gameObj.turn = getNextTurn(gameChange.gameObj, players) // small blind is the first player of round
  gameChange.gameObj.checkingPlayers = []
  gameChange.gameObj.communityCards = drawCard(gameChange.gameObj.deck, 3)

  return gameChange
}

export function toTheTurnOrRiver({ gameChange, players }: ToNextRoundParams): GameChange {
  if (gameChange.status === 'THE_FLOP') {
    gameChange.status = 'THE_TURN'
  } else if (gameChange.status === 'THE_TURN') {
    gameChange.status = 'THE_RIVER'
  } else {
    throw new Error('Something went wrong!')
  }

  gameChange.gameObj.turn = gameChange.gameObj.dealerIndex // set current turn is for dealer
  gameChange.gameObj.turn = getNextTurn(gameChange.gameObj, players) // small blind is the first player of round
  gameChange.gameObj.checkingPlayers = []
  gameChange.gameObj.communityCards = [...gameChange.gameObj.communityCards, ...drawCard(gameChange.gameObj.deck, 1)]

  return gameChange
}

export function toShowDown({ gameChange, players }: ToNextRoundParams): GameChange {
  return gameChange
}

const gameService = { getGameByRoomId, emitGameChangeByRoomId, startGame, callBet, checkBet }

export { gameService }
