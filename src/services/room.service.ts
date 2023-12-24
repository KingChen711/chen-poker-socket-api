import { PrismaClient, Room } from '@prisma/client'
import { CreateRoomParams, LeaveRoomParams } from '~/helpers/params'
import { userService } from './user.service'
import { generateRoomCode } from '~/helpers/generate-room-code'
import ApiError from '~/helpers/api-error'
import { StatusCodes } from 'http-status-codes'
import { InitialBalance } from '~/helpers/constants'
const prisma = new PrismaClient()

const createRoom = async ({ clerkId }: CreateRoomParams): Promise<Room> => {
  const user = await userService.getRequiredUserByClerkId({ clerkId })

  if (user.currentRoomId) {
    await leaveRoom({ clerkId })
  }

  const room = await prisma.room.create({
    data: {
      roomCode: generateRoomCode(),
      status: 'PRE_GAME',
      roomOwner: user.id,
      players: [
        {
          userId: user.id,
          balance: InitialBalance,
          bet: 0,
          hand: {
            holeCards: [],
            pokerCards: [],
            rank: null
          }
        }
      ],
      gameObj: null
    }
  })

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      currentRoomId: room.id
    }
  })

  return room
}

const getRequiredRoomById = async (id: string): Promise<Room> => {
  const room = await prisma.room.findUnique({
    where: { id }
  })

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Not found room!')
  }

  return room
}

const leaveRoom = async ({ clerkId }: LeaveRoomParams): Promise<Room> => {
  const user = await userService.getRequiredUserByClerkId({ clerkId })

  const roomId = user.currentRoomId
  if (!roomId) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Not found room!')
  }

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      currentRoomId: null
    }
  })

  const room = await getRequiredRoomById(roomId)

  if (room.players.length === 1) {
    //last player leave room -> delete room
    return await prisma.room.delete({
      where: { id: room.id }
    })
  }

  const updateData: Partial<Room> = {
    players: room.players.filter((p) => p.userId !== user.id)
  }

  if (room.roomOwner === user.id) {
    updateData.roomOwner = room.players[0].userId
  }

  return await prisma.room.update({
    where: {
      id: room.id
    },
    data: updateData
  })
}

const roomService = {
  createRoom,
  leaveRoom
}

export { roomService }
