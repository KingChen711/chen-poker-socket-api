import { GameObj, GameStatus, Player, User } from '@prisma/client'

export type CreateUserParams = {
  clerkId: string
  email: string
  name: string
  picture: string
  username: string
}

export type DeleteUserParams = { clerkId: string }

export type DeletePlayerParams = { userId: string }

export type CreatePlayerParams = { userId: string; roomId: string }

export type GetUserByClerkIdParams = { clerkId: string }

export type GetUserByIdParams = { id: string }

export type GetUserWithPlayerByClerkIdParams = { clerkId: string }

export type RemoveCurrentRoomIdParams = { userId: string }

export type AssignCurrentRoomIdParams = { userId: string; roomId: string }

export type UpdateUserParams = Partial<User> & { clerkId: string }

export type CreateRoomParams = { clerkId: string }

export type LeaveRoomParams = { clerkId: string }

export type JoinRoomParams = { clerkId: string; roomCode: string }

export type GetPlayersWithUserByRoomIdParams = { roomId: string }

export type StartGameParams = { roomId: string }

export type CallBetParams = { roomId: string; userId: string }

export type CheckBetParams = { roomId: string; userId: string }

export type FoldBetParams = { roomId: string; userId: string }

export type RaiseBetParams = { roomId: string; userId: string; raiseValue: number }

export type GameChange = { gameObj: GameObj; status: GameStatus }

export type ToNextRoundParams = { gameChange: GameChange; players: Player[]; requestingPlayers?: Player }
