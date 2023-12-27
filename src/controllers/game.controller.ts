import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { gameService } from '~/services/game.service'
import { TGetGameByRoomIdSchema, TStartGameSchema } from '~/validations/game.validation'

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

    const game = await gameService.startGame({ roomId })

    res.status(StatusCodes.OK).json({ statusCode: StatusCodes.OK, game })
  } catch (error) {
    next(error)
  }
}
