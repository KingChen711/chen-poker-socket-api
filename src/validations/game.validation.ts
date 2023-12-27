import z from 'zod'

export const GetGameByRoomIdSchema = z.object({
  params: z.object({
    roomId: z.coerce.string().trim()
  })
})

export const StartGameSchema = z.object({
  body: z.object({
    roomId: z.coerce.string().trim()
  })
})

export const CallBetSchema = z.object({
  body: z.object({
    roomId: z.coerce.string().trim(),
    userId: z.coerce.string().trim()
  })
})

export const CheckBetSchema = z.object({
  body: z.object({
    roomId: z.coerce.string().trim(),
    userId: z.coerce.string().trim()
  })
})

export const RaiseBetSchema = z.object({
  body: z.object({
    roomId: z.coerce.string().trim(),
    userId: z.coerce.string().trim(),
    raiseValue: z.coerce.number()
  })
})

export const FoldBetSchema = z.object({
  body: z.object({
    roomId: z.coerce.string().trim(),
    userId: z.coerce.string().trim()
  })
})

export type TGetGameByRoomIdSchema = z.infer<typeof GetGameByRoomIdSchema>
export type TStartGameSchema = z.infer<typeof StartGameSchema>
export type TCallBetSchema = z.infer<typeof CallBetSchema>
export type TCheckBetSchema = z.infer<typeof CheckBetSchema>
export type TRaiseBetSchema = z.infer<typeof RaiseBetSchema>
export type TFoldBetSchema = z.infer<typeof FoldBetSchema>
