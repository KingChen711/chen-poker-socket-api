import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { gameService } from '~/services/game.service'
import { TGetGameByRoomIdSchema } from '~/validations/game.validation'

export const getGameByRoomId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      params: { roomId }
    } = req as unknown as TGetGameByRoomIdSchema

    const game = await gameService.getGameByRoomId(roomId)

    res.status(StatusCodes.OK).json({ game })
  } catch (error) {
    next(error)
  }
}
