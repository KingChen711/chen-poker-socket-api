import express from 'express'
import {
  getGameByRoomId,
  startGame,
  callBet,
  checkBet,
  raiseBet,
  foldBet,
  allInBet,
  readyNextMatch
} from '~/controllers/game.controller'
import { validateData } from '~/middlewares/validate-data.middleware'
import {
  CallBetSchema,
  CheckBetSchema,
  GetGameByRoomIdSchema,
  RaiseBetSchema,
  StartGameSchema,
  FoldBetSchema,
  AllInBetSchema,
  ReadyNextMatchSchema
} from '~/validations/game.validation'

const router = express.Router()

router.post('/start', validateData(StartGameSchema), startGame)
router.post('/call', validateData(CallBetSchema), callBet)
router.post('/check', validateData(CheckBetSchema), checkBet)
router.post('/raise', validateData(RaiseBetSchema), raiseBet)
router.post('/fold', validateData(FoldBetSchema), foldBet)
router.post('/all-in', validateData(AllInBetSchema), allInBet)
router.post('/ready-next-match', validateData(ReadyNextMatchSchema), readyNextMatch)
router.get('/:roomId', validateData(GetGameByRoomIdSchema), getGameByRoomId)
export { router as gameRoute }
