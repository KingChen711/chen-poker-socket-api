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

export type TCreateRoomSchema = z.infer<typeof CreateRoomSchema>
export type TLeaveRoomSchema = z.infer<typeof LeaveRoomSchema>
