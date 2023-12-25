import { Player, PrismaClient } from '@prisma/client'
import { CreatePlayerParams, DeletePlayerParams, GetPlayersWithUserByRoomIdParams } from '~/helpers/params'

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

const getPlayersWithUserByRoomId = async ({ roomId }: GetPlayersWithUserByRoomIdParams) => {
  return await prisma.player.findMany({
    where: { roomId },
    include: {
      user: true
    }
  })
}

const playerService = { deletePlayerByUserId, createPlayer, getPlayersWithUserByRoomId }

export { playerService }
