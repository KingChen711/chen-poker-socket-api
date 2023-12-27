import express from 'express'
import { getGameByRoomId, startGame, callBet, checkBet, raiseBet, foldBet } from '~/controllers/game.controller'
import { validateData } from '~/middlewares/validate-data.middleware'
import {
  CallBetSchema,
  CheckBetSchema,
  GetGameByRoomIdSchema,
  RaiseBetSchema,
  StartGameSchema,
  FoldBetSchema
} from '~/validations/game.validation'

const router = express.Router()

router.post('/start', validateData(StartGameSchema), startGame)
router.post('/call', validateData(CallBetSchema), callBet)
router.post('/check', validateData(CheckBetSchema), checkBet)
router.post('/raise', validateData(RaiseBetSchema), raiseBet)
router.post('/fold', validateData(FoldBetSchema), foldBet)
router.get('/:roomId', validateData(GetGameByRoomIdSchema), getGameByRoomId)
export { router as gameRoute }
