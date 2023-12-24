import z from 'zod'

export const CreateUserSchema = z.object({
  body: z.object({
    clerkId: z.coerce.string().trim().min(1),
    email: z.coerce.string().trim().email(),
    name: z.coerce.string().trim().min(1),
    picture: z.coerce.string().trim().url(),
    username: z.coerce.string().trim().min(1)
  })
})

export const UpdateUserSchema = z.object({
  params: z.object({
    clerkId: z.string()
  }),
  body: z.object({
    name: z.coerce.string().trim().min(1).optional(),
    picture: z.coerce.string().trim().url().optional(),
    username: z.coerce.string().trim().min(1).optional(),
    currentRoomId: z.coerce.string().trim().min(1).optional()
  })
})

export const DeleteUserSchema = z.object({
  params: z.object({
    clerkId: z.string()
  })
})

export const GetUserByClerkIdSchema = z.object({
  query: z.object({
    clerkId: z.string()
  })
})

export const GetUserByIdSchema = z.object({
  params: z.object({
    id: z.string()
  })
})

export type TCreateUserSchema = z.infer<typeof CreateUserSchema>
export type TUpdateUserSchema = z.infer<typeof UpdateUserSchema>
export type TDeleteUserSchema = z.infer<typeof DeleteUserSchema>
export type TGetUserByClerkIdSchema = z.infer<typeof GetUserByClerkIdSchema>
export type TGetUserByIdSchema = z.infer<typeof GetUserByIdSchema>
