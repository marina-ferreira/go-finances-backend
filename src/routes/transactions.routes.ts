import multer from 'multer'
import { Router } from 'express'
import { getCustomRepository } from 'typeorm'

import uploadConfig from '../config/upload'
import AppError from '../errors/AppError'

import TransactionsRepository from '../repositories/TransactionsRepository'
import CreateTransactionService from '../services/CreateTransactionService'
import DeleteTransactionService from '../services/DeleteTransactionService'
import ImportTransactionsService from '../services/ImportTransactionsService'

const transactionsRouter = Router()
const upload = multer(uploadConfig)

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository)
  const balance = await transactionsRepository.getBalance()
  const transactions = await transactionsRepository.find({
    relations: ['category']
  })

  return response.json({ transactions, balance })
})

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body
  const newTransaction = { title, value, type, category }

  const createTransactionService = new CreateTransactionService()
  const transaction = await createTransactionService.execute(newTransaction)

  return response.json(transaction)
})

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params
  const deleteTransactionService = new DeleteTransactionService()

  await deleteTransactionService.execute(id)

  return response.status(204).send()
})

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    if (!request.file) throw new AppError('Missing csv file', 422)

    const { filename } = request.file
    const importTransactionsService = new ImportTransactionsService()

    const transactions = await importTransactionsService.execute(filename)
    return response.json(transactions)
  }
)

export default transactionsRouter
