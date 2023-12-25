import express from 'express'
import { createRoom, leaveRoom, getRoomById } from '~/controllers/room.controller'
import { validateData } from '~/middlewares/validate-data.middleware'
import { CreateRoomSchema, GetRoomByIdSchema, LeaveRoomSchema } from '~/validations/room.validation'

const router = express.Router()

router.post('/leave', validateData(LeaveRoomSchema), leaveRoom)
router.get('/:id', validateData(GetRoomByIdSchema), getRoomById)
router.post('/', validateData(CreateRoomSchema), createRoom)

export { router as roomRoute }
