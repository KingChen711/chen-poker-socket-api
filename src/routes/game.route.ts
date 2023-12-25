import express from 'express'
import { getGameByRoomId, startGame } from '~/controllers/game.controller'
import { validateData } from '~/middlewares/validate-data.middleware'
import { GetGameByRoomIdSchema, StartGameSchema } from '~/validations/game.validation'

const router = express.Router()

router.post('/start', validateData(StartGameSchema), startGame)
router.get('/:roomId', validateData(GetGameByRoomIdSchema), getGameByRoomId)
export { router as gameRoute }
