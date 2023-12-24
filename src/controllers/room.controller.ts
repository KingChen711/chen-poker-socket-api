import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { roomService } from '~/services/room.service'
import { TCreateRoomSchema, TLeaveRoomSchema } from '~/validations/room.validation'

export const createRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      body: { clerkId }
    } = req as TCreateRoomSchema

    const room = await roomService.createRoom({ clerkId })

    res.status(StatusCodes.OK).json({ room })
  } catch (error) {
    next(error)
  }
}

export const leaveRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      body: { clerkId }
    } = req as TLeaveRoomSchema

    await roomService.leaveRoom({ clerkId })

    res.status(StatusCodes.OK).json({ message: 'You have leave the room' })
  } catch (error) {
    next(error)
  }
}
