import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { userRoute } from './routes/user.route'
import { errorHandlingMiddleware } from './middlewares/error-handling.middleware'
import { roomRoute } from './routes/room.route'
import { gameRoute } from './routes/game.route'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/users', userRoute)
app.use('/api/rooms', roomRoute)
app.use('/api/games', gameRoute)

app.use(errorHandlingMiddleware)

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*'
  }
})

io.on('connect', (socket) => {
  console.log(`some one connect: ${socket.id}`)

  socket.on('join-room', (data) => {
    console.log('room-message', `${data.username} joins the room!`)

    socket.join(data.roomId)
    io.to(data.roomId).emit('room-message', `${data.username} joins the room!`)
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`Listing on Port ${PORT}`))
