import express from 'express'
import { getGameByRoomId, startGame, callBet, checkBet } from '~/controllers/game.controller'
import { validateData } from '~/middlewares/validate-data.middleware'
import { CallBetSchema, CheckBetSchema, GetGameByRoomIdSchema, StartGameSchema } from '~/validations/game.validation'

const router = express.Router()

router.post('/start', validateData(StartGameSchema), startGame)
router.post('/call', validateData(CallBetSchema), callBet)
router.post('/check', validateData(CheckBetSchema), checkBet)
router.get('/:roomId', validateData(GetGameByRoomIdSchema), getGameByRoomId)
export { router as gameRoute }
