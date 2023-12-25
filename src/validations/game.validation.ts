import z from 'zod'

export const GetGameByRoomIdSchema = z.object({
  params: z.object({
    roomId: z.coerce.string().trim()
  })
})

export type TGetGameByRoomIdSchema = z.infer<typeof GetGameByRoomIdSchema>
