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

export type TCreateUserSchema = z.infer<typeof CreateUserSchema>

export const UpdateUserSchema = z.object({
  params: z.object({
    clerkId: z.string()
  }),
  body: z.object({
    name: z.coerce.string().trim().min(1).optional(),
    picture: z.coerce.string().trim().url().optional(),
    username: z.coerce.string().trim().min(1).optional()
  })
})

export type TUpdateUserSchema = z.infer<typeof UpdateUserSchema>

export const DeleteUserSchema = z.object({
  params: z.object({
    clerkId: z.string()
  })
})

export type TDeleteUserSchema = z.infer<typeof DeleteUserSchema>
