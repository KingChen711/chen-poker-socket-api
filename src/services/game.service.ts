import { GameObj, Player, Prisma, PrismaClient, Room } from '@prisma/client'
import { playerService } from './player.service'
import { io } from '..'
import {
  AllInBetParams,
  CallBetParams,
  CheckBetParams,
  FoldBetParams,
  GameChange,
  RaiseBetParams,
  ReadyNextMatchParams,
  StartGameParams,
  ToNextRoundParams
} from '~/helpers/params'
import { BigBlindValue, InitialBalance, SmallBlindValue, deck } from '~/helpers/constants'
import { drawCard } from '~/helpers/game'
import { Game, Rank } from '~/types'
import { roomService } from './room.service'
import ApiError from '~/helpers/api-error'
import { StatusCodes } from 'http-status-codes'
import { assignRankHand } from '~/helpers/poker/assign-rank-hand'
import { compareHand } from '~/helpers/poker/compare'
import { DefaultArgs } from '@prisma/client/runtime/library'

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

  await prisma.player.update({
    where: { id: callingPlayer.id },
    data: {
      balance: callingPlayer.balance! - gameObj.callingValue + callingPlayer.bet!,
      bet: gameObj.callingValue
    }
  })

  let updatedDataRoom = {
    gameObj: {
      ...gameObj,
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
    updatedDataRoom = await toNextRound({ gameChange: updatedDataRoom, players })
  }

  await prisma.room.update({
    where: { id: room.id },
    data: updatedDataRoom
  })

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
      ...gameObj,
      checkingPlayers: [...gameObj.checkingPlayers, userId],
      turn: getNextTurn(gameObj, players)
    },
    status: room.status
  } as GameChange

  // add one for the checking player
  const conditionEndRound =
    gameObj.checkingPlayers.length + 1 + gameObj.foldPlayers.length + gameObj.allInPlayers.length === players.length

  if (conditionEndRound) {
    updatedDataRoom = await toNextRound({ gameChange: updatedDataRoom, players })
  }

  const updatedRoom = await prisma.room.update({
    where: { id: room.id },
    data: updatedDataRoom
  })

  io.to(room.id).emit('room-change', updatedRoom)
}

const raiseBet = async ({ roomId, userId, raiseValue }: RaiseBetParams) => {
  const room = await roomService.getRequiredRoomById(roomId)
  const players = await playerService.getPlayersWithUserByRoomId({ roomId: room.id })

  const raisingPlayer = players.find((p) => p.userId === userId)

  if (!raisingPlayer) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'This user is not a player of the room.')
  }

  const gameObj = room.gameObj

  if (!gameObj) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Maybe the game is not started')
  }

  const updateCallingPlayerPromise = prisma.player.update({
    where: { id: raisingPlayer.id },
    data: {
      balance: raisingPlayer.balance! + raisingPlayer.bet! - raiseValue - gameObj.callingValue,
      bet: gameObj.callingValue + raiseValue
    }
  })

  const updateRoomPromise = prisma.room.update({
    where: { id: room.id },
    data: {
      gameObj: {
        ...gameObj,
        callingValue: gameObj.callingValue + raiseValue,
        checkingPlayers: [],
        turn: getNextTurn(gameObj, players)
      }
    }
  })

  await Promise.all([updateCallingPlayerPromise, updateRoomPromise])
  await gameService.emitGameChangeByRoomId(room.id)
}

const foldBet = async ({ roomId, userId }: FoldBetParams) => {
  const room = await roomService.getRequiredRoomById(roomId)
  const players = await playerService.getPlayersWithUserByRoomId({ roomId: room.id })

  const foldingPlayer = players.find((p) => p.userId === userId)

  if (!foldingPlayer) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'This user is not a player of the room.')
  }

  const gameObj = room.gameObj

  if (!gameObj) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Maybe the game is not started')
  }

  let updatedDataRoom = {
    gameObj: {
      ...gameObj,
      foldPlayers: [...gameObj.foldPlayers, userId],
      turn: getNextTurn(gameObj, players)
    },
    status: room.status
  } as GameChange

  if (players.length - gameObj.foldPlayers.length === 2) {
    //it mean that the foldingPlayer folds when only rest 2 player -> need to showdown
    updatedDataRoom = await showDownFold({ gameChange: updatedDataRoom, players })
  } else {
    const conditionEndRound =
      gameObj.checkingPlayers.length + gameObj.foldPlayers.length + 1 + gameObj.allInPlayers.length === players.length

    if (conditionEndRound) {
      updatedDataRoom = await toNextRound({ gameChange: updatedDataRoom, players })
    }
  }

  const updatedRoom = await prisma.room.update({
    where: { id: room.id },
    data: updatedDataRoom
  })

  io.to(room.id).emit('room-change', updatedRoom)
}

const allInBet = async ({ roomId, userId }: AllInBetParams) => {
  const room = await roomService.getRequiredRoomById(roomId)
  const players = await playerService.getPlayersWithUserByRoomId({ roomId: room.id })

  const allInPlayer = players.find((p) => p.userId === userId)

  if (!allInPlayer) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'This user is not a player of the room.')
  }

  const gameObj = room.gameObj

  if (!gameObj) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Maybe the game is not started')
  }

  await prisma.player.update({
    where: {
      id: allInPlayer.id
    },
    data: {
      bet: allInPlayer.bet! + allInPlayer.balance!,
      balance: 0
    }
  })

  let updatedDataRoom = {
    gameObj: {
      ...gameObj,
      allInPlayers: [...gameObj.allInPlayers, userId],
      turn: getNextTurn(gameObj, players)
    },
    status: room.status
  } as GameChange

  const playerWhoNeedToCall = players.find(
    (p) =>
      p.id !== allInPlayer.id &&
      p.bet! < gameObj.callingValue &&
      !gameObj.foldPlayers.includes(p.userId) &&
      !gameObj.allInPlayers.includes(p.userId)
  )
  if (!playerWhoNeedToCall) {
    updatedDataRoom = await toNextRound({ gameChange: updatedDataRoom, players })
  }

  await prisma.room.update({
    where: { id: room.id },
    data: updatedDataRoom
  })

  await gameService.emitGameChangeByRoomId(room.id)
}

const readyNextMatch = async ({ roomId, userId }: ReadyNextMatchParams) => {
  const room = await roomService.getRequiredRoomById(roomId)
  const players = await playerService.getPlayersWithUserByRoomId({ roomId: room.id })

  const readyPlayer = players.find((p) => p.userId === userId)

  if (!readyPlayer) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'This user is not a player of the room.')
  }

  const gameObj = room.gameObj

  if (!gameObj) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Maybe the game is not started')
  }

  let updatedDataRoom = {
    gameObj: {
      ...gameObj,
      readyPlayers: [...gameObj.readyPlayers, userId]
    }
  } as GameChange

  if (gameObj.readyPlayers.length + 1 === players.length) {
    updatedDataRoom = await toNextMatch({ gameChange: updatedDataRoom, players })
  }

  await prisma.room.update({
    where: { id: room.id },
    data: updatedDataRoom
  })

  await gameService.emitGameChangeByRoomId(room.id)
}

export async function toNextMatch({ gameChange, players }: ToNextRoundParams): Promise<GameChange> {
  const dealerIndex = gameChange.gameObj.dealerIndex + 1
  const numberOfPlayers = players.length
  gameChange.gameObj.dealerIndex = dealerIndex
  gameChange.gameObj.callingValue = BigBlindValue
  gameChange.gameObj.turn = dealerIndex + 3
  gameChange.gameObj.dealer = players[dealerIndex % numberOfPlayers].userId
  gameChange.gameObj.smallBlind = players[(dealerIndex + 1) % numberOfPlayers].userId
  gameChange.gameObj.bigBlind = players[(dealerIndex + 2) % numberOfPlayers].userId
  gameChange.gameObj.deck = [...deck]
  gameChange.gameObj.foldPlayers = []
  gameChange.gameObj.allInPlayers = []
  gameChange.gameObj.communityCards = []
  gameChange.gameObj.checkingPlayers = []
  gameChange.gameObj.readyPlayers = []
  gameChange.gameObj.winner = null
  gameChange.status = 'PRE_FLOP'

  const updatePlayerPromise = players.map((p) => {
    return prisma.player.update({
      where: { id: p.id },
      data: {
        hand: { holeCards: drawCard(gameChange.gameObj.deck, 2), pokerCards: [], rank: null },
        balance:
          p.userId === gameChange.gameObj.smallBlind
            ? p.balance! - SmallBlindValue
            : p.userId === gameChange.gameObj.bigBlind
              ? p.balance! - BigBlindValue
              : p.balance,
        bet:
          p.userId === gameChange.gameObj.smallBlind
            ? SmallBlindValue
            : p.userId === gameChange.gameObj.bigBlind
              ? BigBlindValue
              : 0
      }
    })
  })

  await Promise.all(updatePlayerPromise)

  return gameChange
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

export async function toNextRound({ gameChange, players }: ToNextRoundParams): Promise<GameChange> {
  if (gameChange.status === 'PRE_FLOP') {
    return toTheFlop({ gameChange, players })
  }

  if (gameChange.status === 'THE_FLOP' || gameChange.status === 'THE_TURN') {
    return toTheTurnOrRiver({ gameChange, players })
  }

  if (gameChange.status === 'THE_RIVER') {
    return await toShowDown({ gameChange, players })
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

export async function toShowDown({ gameChange, players: ps }: ToNextRoundParams): Promise<GameChange> {
  let pot = 0
  const players = await playerService.getPlayersWithUserByRoomId({ roomId: ps[0].roomId })
  const updatePlayersPromise = players.map((p) => {
    pot += p.bet!
    const newHand = assignRankHand(p.hand!, gameChange.gameObj.communityCards)
    if (gameChange.gameObj.foldPlayers.includes(p.userId)) {
      newHand.rank = Rank.Fold
    }

    return prisma.player.update({
      where: { id: p.id },
      data: {
        bet: 0,
        hand: newHand
      }
    })
  })

  const updatedPlayers = await Promise.all(updatePlayersPromise)

  gameChange.status = 'SHOWDOWN'
  gameChange.gameObj.checkingPlayers = []
  gameChange.gameObj.allInPlayers = []
  gameChange.gameObj.readyPlayers = []
  gameChange.gameObj.winner = [...updatedPlayers].sort((p1, p2) => {
    return compareHand(p1.hand!, p2.hand!)
  })[0].userId

  const winner = updatedPlayers.find((p) => p.userId === gameChange.gameObj.winner)!

  const updateWinnerPromise = prisma.player.update({
    where: { id: winner.id },
    data: {
      balance: winner.balance! + pot
    }
  })

  const deletePlayersPromise = [updateWinnerPromise]
  updatedPlayers.forEach((p) => {
    if (p.id === winner.id) {
      return
    }
    if (p.balance === 0) {
      deletePlayersPromise.push(
        prisma.player.delete({
          where: {
            id: p.id
          }
        })
      )
    }
  })

  await Promise.all(deletePlayersPromise)

  return gameChange
}

export async function showDownFold({ gameChange, players }: ToNextRoundParams): Promise<GameChange> {
  gameChange.gameObj.winner = players.find((p) => !gameChange.gameObj.foldPlayers.includes(p.userId))!.userId
  gameChange.gameObj.checkingPlayers = []
  const amountNeedDrawMore = 5 - gameChange.gameObj.communityCards.length
  gameChange.gameObj.communityCards = [
    ...gameChange.gameObj.communityCards,
    ...drawCard(gameChange.gameObj.deck, amountNeedDrawMore)
  ]

  let pot = 0
  gameChange.status = 'SHOWDOWN'

  const updatePlayersPromise = players.map((p) => {
    pot += p.bet!
    let newHand = { ...p.hand! }
    if (p.userId !== gameChange.gameObj.winner) {
      newHand.rank = Rank.Fold
    } else {
      newHand = assignRankHand(newHand, gameChange.gameObj.communityCards)
    }

    return prisma.player.update({
      where: { id: p.id },
      data: {
        bet: 0,
        hand: newHand
      }
    })
  })

  const updatedPlayers = await Promise.all(updatePlayersPromise)

  const winner = updatedPlayers.find((p) => p.userId === gameChange.gameObj.winner)!

  const updateWinnerPromise = prisma.player.update({
    where: { id: winner.id },
    data: {
      balance: winner.balance! + pot
    }
  })

  const deletePlayersPromise = [updateWinnerPromise]
  updatedPlayers.forEach((p) => {
    if (p.id === winner.id) {
      return
    }
    if (p.balance === 0) {
      deletePlayersPromise.push(
        prisma.player.delete({
          where: {
            id: p.id
          }
        })
      )
    }
  })

  await Promise.all(deletePlayersPromise)

  return gameChange
}

const gameService = {
  getGameByRoomId,
  emitGameChangeByRoomId,
  startGame,
  callBet,
  checkBet,
  raiseBet,
  foldBet,
  allInBet,
  readyNextMatch
}

export { gameService }
