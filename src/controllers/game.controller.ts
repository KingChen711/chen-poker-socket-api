import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { gameService } from '~/services/game.service'
import {
  TCallBetSchema,
  TCheckBetSchema,
  TFoldBetSchema,
  TGetGameByRoomIdSchema,
  TStartGameSchema,
  TRaiseBetSchema
} from '~/validations/game.validation'

export const getGameByRoomId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      params: { roomId }
    } = req as unknown as TGetGameByRoomIdSchema

    const game = await gameService.getGameByRoomId(roomId)

    res.status(StatusCodes.OK).json({ statusCode: StatusCodes.OK, game })
  } catch (error) {
    next(error)
  }
}

export const startGame = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      body: { roomId }
    } = req as unknown as TStartGameSchema

    await gameService.startGame({ roomId })

    res.status(StatusCodes.OK).json({ statusCode: StatusCodes.OK })
  } catch (error) {
    next(error)
  }
}

export const callBet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      body: { roomId, userId }
    } = req as unknown as TCallBetSchema

    await gameService.callBet({ roomId, userId })

    res.status(StatusCodes.OK).json({ statusCode: StatusCodes.OK })
  } catch (error) {
    next(error)
  }
}

export const checkBet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      body: { roomId, userId }
    } = req as unknown as TCheckBetSchema

    await gameService.checkBet({ roomId, userId })

    res.status(StatusCodes.OK).json({ statusCode: StatusCodes.OK })
  } catch (error) {
    next(error)
  }
}

export const raiseBet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      body: { roomId, userId, raiseValue }
    } = req as unknown as TRaiseBetSchema

    await gameService.raiseBet({ roomId, userId, raiseValue })

    res.status(StatusCodes.OK).json({ statusCode: StatusCodes.OK })
  } catch (error) {
    next(error)
  }
}

export const foldBet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      body: { roomId, userId }
    } = req as unknown as TFoldBetSchema

    await gameService.foldBet({ roomId, userId })

    res.status(StatusCodes.OK).json({ statusCode: StatusCodes.OK })
  } catch (error) {
    next(error)
  }
}
