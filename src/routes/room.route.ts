import express from 'express'
import { createRoom, leaveRoom, getRoomById, joinRoom } from '~/controllers/room.controller'
import { validateData } from '~/middlewares/validate-data.middleware'
import { CreateRoomSchema, GetRoomByIdSchema, LeaveRoomSchema, JoinRoomSchema } from '~/validations/room.validation'

const router = express.Router()

router.post('/leave', validateData(LeaveRoomSchema), leaveRoom)
router.post('/join', validateData(JoinRoomSchema), joinRoom)
router.get('/:id', validateData(GetRoomByIdSchema), getRoomById)
router.post('/', validateData(CreateRoomSchema), createRoom)

export { router as roomRoute }
