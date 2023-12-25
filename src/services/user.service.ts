import { PrismaClient, User } from '@prisma/client'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/helpers/api-error'
import {
  CreateUserParams,
  DeleteUserParams,
  GetUserByClerkIdParams,
  GetUserByIdParams,
  GetUserWithPlayerByClerkIdParams,
  UpdateUserParams
} from '~/helpers/params'
const prisma = new PrismaClient()

const createUser = async (params: CreateUserParams): Promise<User> => {
  return await prisma.user.create({
    data: params
  })
}

const updateUser = async (params: UpdateUserParams): Promise<User> => {
  return await prisma.user.update({
    where: {
      clerkId: params.clerkId
    },
    data: params
  })
}

const deleteUser = async (params: DeleteUserParams): Promise<User> => {
  return await prisma.user.delete({
    where: {
      clerkId: params.clerkId
    }
  })
}

const getUserByClerkId = async (params: GetUserByClerkIdParams): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: {
      clerkId: params.clerkId
    }
  })
}

const getRequiredUserByClerkId = async (params: GetUserByClerkIdParams): Promise<User> => {
  const user = await prisma.user.findUnique({
    where: {
      clerkId: params.clerkId
    }
  })

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Not found user!')
  }

  return user
}

const getUserById = async (params: GetUserByIdParams): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: {
      id: params.id
    }
  })
}

const getUserWithPlayerByClerkId = async (params: GetUserWithPlayerByClerkIdParams) => {
  return await prisma.user.findUnique({
    where: {
      clerkId: params.clerkId
    },
    include: {
      player: true
    }
  })
}

const userService = {
  createUser,
  updateUser,
  deleteUser,
  getUserByClerkId,
  getUserById,
  getRequiredUserByClerkId,
  getUserWithPlayerByClerkId
}

export { userService }
