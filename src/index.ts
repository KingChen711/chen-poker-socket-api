import express from 'express'
import http from 'http'
import cors from 'cors'
import { userRoute } from './routes/user.route'
import { errorHandlingMiddleware } from './middlewares/error-handling.middleware'
import { roomRoute } from './routes/room.route'
import { gameRoute } from './routes/game.route'
import { Server } from 'socket.io'
import { roomService } from './services/room.service'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/users', userRoute)
app.use('/api/rooms', roomRoute)
app.use('/api/games', gameRoute)

app.use(errorHandlingMiddleware)

const server = http.createServer(app)
const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`Listing on Port ${PORT}`))

export const io = new Server(server, {
  cors: {
    origin: '*'
  }
})

io.on('connect', (socket) => {
  console.log(`some one connect: ${socket.id}`)

  socket.on('join-room', (data) => {
    console.log('room-message', `${data.username} has joined the room!`)

    socket.join(data.roomId)
    io.to(data.roomId).emit('room-message', `${data.username} has joined the room!`)
  })

  socket.on('leave-room', async (data) => {
    if (data.clerkId) {
      console.log('room-message', `${data.username} has left the room!`)
      socket.leave(data.roomId)
      await roomService.leaveRoom({ clerkId: data.clerkId })
      io.to(data.roomId).emit('room-message', `${data.username} has left the room!`)
    }
  })
})
