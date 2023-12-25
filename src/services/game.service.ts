import { PrismaClient } from '@prisma/client'
import { playerService } from './player.service'
import { io } from '..'

const prisma = new PrismaClient()

const getGameByRoomId = async (id: string): Promise<Game | null> => {
  const room = await prisma.room.findUnique({
    where: { id }
  })

  const players = await playerService.getPlayersWithUserByRoomId({ roomId: id })

  return { room, players }
}

const emitGameChangeByRoomId = async (id: string) => {
  const game = await getGameByRoomId(id)
  if (game) {
    io.to(game.room.id).emit('room-change', game.room)
    io.to(game.room.id).emit('players-change', game.players)
  }
}

const gameService = { getGameByRoomId, emitGameChangeByRoomId }

export { gameService }
