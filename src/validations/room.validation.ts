import z from 'zod'

export const CreateRoomSchema = z.object({
  body: z.object({
    clerkId: z.coerce.string().trim()
  })
})

export const LeaveRoomSchema = z.object({
  body: z.object({
    clerkId: z.coerce.string().trim()
  })
})

export const JoinRoomSchema = z.object({
  body: z.object({
    clerkId: z.coerce.string().trim(),
    roomCode: z.coerce.string().trim()
  })
})

export const GetRoomByIdSchema = z.object({
  params: z.object({
    id: z.coerce.string().trim()
  })
})

export type TCreateRoomSchema = z.infer<typeof CreateRoomSchema>
export type TLeaveRoomSchema = z.infer<typeof LeaveRoomSchema>
export type TGetRoomByIdSchema = z.infer<typeof GetRoomByIdSchema>
export type TJoinRoomSchema = z.infer<typeof JoinRoomSchema>
