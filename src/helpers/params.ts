import { User } from '@prisma/client'

export type CreateUserParams = {
  clerkId: string
  email: string
  name: string
  picture: string
  username: string
}

export type DeleteUserParams = {
  id: string
}

export type UpdateUserParams = Partial<User>
