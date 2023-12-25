import { PrismaClient, Room } from '@prisma/client'
import { CreateRoomParams, JoinRoomParams, LeaveRoomParams } from '~/helpers/params'
import { userService } from './user.service'
import { generateRoomCode } from '~/helpers/generate-room-code'
import ApiError from '~/helpers/api-error'
import { StatusCodes } from 'http-status-codes'
import { playerService } from './player.service'

const prisma = new PrismaClient()

const createRoom = async ({ clerkId }: CreateRoomParams): Promise<Room> => {
  const user = await userService.getUserWithPlayerByClerkId({ clerkId })

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found!')
  }

  if (user.player?.roomId) {
    await leaveRoom({ clerkId })
  }

  const room = await prisma.room.create({
    data: {
      roomCode: generateRoomCode(),
      status: 'PRE_GAME',
      roomOwner: user.id
    }
  })

  await playerService.createPlayer({ userId: user.id, roomId: room.id })

  return room
}

const getRoomById = async (id: string): Promise<Room | null> => {
  const room = await prisma.room.findUnique({
    where: { id }
  })

  return room
}

const leaveRoom = async ({ clerkId }: LeaveRoomParams) => {
  const user = await userService.getUserWithPlayerByClerkId({ clerkId })

  const roomId = user?.player?.roomId
  if (!roomId) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Not found room!')
  }

  await playerService.deletePlayerByUserId({ userId: user.id })

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      players: true
    }
  })

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Could not find room')
  }

  if (room.players.length === 0) {
    //last player leave room -> delete room
    return await prisma.room.delete({
      where: { id: room.id }
    })
  }

  if (room.roomOwner === user.id) {
    await prisma.room.update({
      where: {
        id: room.id
      },
      data: {
        roomOwner: room.players[0].userId
      }
    })
  }

  if (room?.status === 'PRE_GAME') {
    return
  }

  //TODO: clean game when a player has left
  console.log('')
}

const joinRoom = async ({ clerkId, roomCode }: JoinRoomParams): Promise<Room> => {
  const room = await prisma.room.findUnique({
    where: { roomCode }
  })

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Could not find room!')
  }

  if (room.status !== 'PRE_GAME') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot join a room that is already in the game')
  }

  const user = await userService.getUserWithPlayerByClerkId({ clerkId })

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found!')
  }

  if (user.player?.roomId) {
    if (user.player.roomId === room.id) {
      return room
    }
    await leaveRoom({ clerkId })
  }

  await playerService.createPlayer({ userId: user.id, roomId: room.id })

  return room
}

const roomService = {
  createRoom,
  leaveRoom,
  getRoomById,
  joinRoom
}

export { roomService }
