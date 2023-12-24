import express from 'express'
import { createRoom, leaveRoom } from '~/controllers/room.controller'
import { validateData } from '~/middlewares/validate-data.middleware'
import { CreateRoomSchema, LeaveRoomSchema } from '~/validations/room.validation'

const router = express.Router()

router.post('/leave', validateData(LeaveRoomSchema), leaveRoom)
router.post('/', validateData(CreateRoomSchema), createRoom)

export { router as roomRoute }
