import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/user.service'
import { TCreateUserSchema, TDeleteUserSchema, TUpdateUserSchema } from '~/validations/user.validation'

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = req as TCreateUserSchema

    const user = await userService.createUser(body)

    res.status(StatusCodes.OK).json({ user })
  } catch (error) {
    next(error)
  }
}

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      body,
      params: { clerkId }
    } = req as unknown as TUpdateUserSchema

    const user = await userService.updateUser({ ...body, clerkId })

    res.status(StatusCodes.OK).json({ user })
  } catch (error) {
    next(error)
  }
}

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      params: { clerkId }
    } = req as unknown as TDeleteUserSchema

    const user = await userService.deleteUser({ clerkId })

    res.status(StatusCodes.OK).json({ user })
  } catch (error) {
    next(error)
  }
}
