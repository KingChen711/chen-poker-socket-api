import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const getGameByRoomId = async (id: string): Promise<Game | null> => {
  const room = await prisma.room.findUnique({
    where: { id }
  })

  const players = await prisma.player.findMany({
    where: { roomId: id },
    include: {
      user: true
    }
  })

  return { room, players }
}

const gameService = { getGameByRoomId }

export { gameService }
