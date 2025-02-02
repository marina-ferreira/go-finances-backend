import 'reflect-metadata'
import 'dotenv/config'

import express, { Request, Response, NextFunction } from 'express'
import 'express-async-errors'
import cors from 'cors'

import routes from './routes'
import AppError from './errors/AppError'
import uploadConfig from './config/upload'

import createConnection from './database'

createConnection()
const app = express()

app.use(express.json())
app.use('/files', express.static(uploadConfig.directory))
app.use(cors())
app.use(routes)

app.use((err: Error, request: Request, response: Response, _: NextFunction) => {
  if (err instanceof AppError) {
    return response.status(err.statusCode).json({
      status: 'error',
      message: err.message
    })
  }

  console.error(err)

  return response.status(500).json({
    status: 'error',
    message: 'Internal server error'
  })
})

export default app
