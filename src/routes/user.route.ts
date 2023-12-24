import express from 'express'
import { createUser, deleteUser, updateUser } from '~/controllers/user.controller'
import { validateData } from '~/middlewares/validate-data.middleware'
import { CreateUserSchema, DeleteUserSchema, UpdateUserSchema } from '~/validations/user.validation'

const router = express.Router()

router.post('/', validateData(CreateUserSchema), createUser)
router.put('/:id', validateData(UpdateUserSchema), updateUser)
router.put('/:id', validateData(DeleteUserSchema), deleteUser)

export { router as userRoute }