import { PrismaClient, User } from '@prisma/client'
import { CreateUserParams, DeleteUserParams, UpdateUserParams } from '~/helpers/params'
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

const userService = {
  createUser,
  updateUser,
  deleteUser
}

export { userService }
