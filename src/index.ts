import express from 'express'
import http from 'http'
import { Server } from 'socket.io'

const app = express()

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000'
  }
})

io.on('connect', () => {
  console.log('some one connect')
})
io.on('disconnect', () => {
  console.log('some one disconnect')
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`Listing on Port ${PORT}`))
