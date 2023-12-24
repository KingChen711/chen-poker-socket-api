import express from 'express'
import { createUser, deleteUser, updateUser, getUserByClerkId, getUserById } from '~/controllers/user.controller'
import { validateData } from '~/middlewares/validate-data.middleware'
import {
  CreateUserSchema,
  DeleteUserSchema,
  GetUserByClerkIdSchema,
  GetUserByIdSchema,
  UpdateUserSchema
} from '~/validations/user.validation'

const router = express.Router()

router.get('/get-by-clerk-id', validateData(GetUserByClerkIdSchema), getUserByClerkId)
router.get('/:id', validateData(GetUserByIdSchema), getUserById)
router.put('/:clerkId', validateData(UpdateUserSchema), updateUser)
router.delete('/:clerkId', validateData(DeleteUserSchema), deleteUser)
router.post('/', validateData(CreateUserSchema), createUser)

export { router as userRoute }
