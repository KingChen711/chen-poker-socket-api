import express from 'express'
import { getGameByRoomId } from '~/controllers/game.controller'
import { validateData } from '~/middlewares/validate-data.middleware'
import { GetGameByRoomIdSchema } from '~/validations/game.validation'

const router = express.Router()

router.get('/:roomId', validateData(GetGameByRoomIdSchema), getGameByRoomId)
export { router as gameRoute }
