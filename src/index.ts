import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { userRoute } from './routes/user.route'
import { errorHandlingMiddleware } from './middlewares/error-handling.middleware'

const app = express()

app.use(cors())

app.use('/api/users', userRoute)

app.use(errorHandlingMiddleware)

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
