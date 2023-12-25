import { Player, PrismaClient } from '@prisma/client'
import { CreatePlayerParams, DeletePlayerParams } from '~/helpers/params'

const prisma = new PrismaClient()

const deletePlayerByUserId = async ({ userId }: DeletePlayerParams): Promise<Player | null> => {
  return await prisma.player.delete({
    where: { userId }
  })
}

const createPlayer = async ({ userId, roomId }: CreatePlayerParams): Promise<Player> => {
  return await prisma.player.create({
    data: {
      userId,
      roomId
    }
  })
}

const playerService = { deletePlayerByUserId, createPlayer }

export { playerService }
