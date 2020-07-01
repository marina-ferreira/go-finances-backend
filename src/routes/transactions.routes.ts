import multer from 'multer'
import { Router } from 'express'
import { getCustomRepository } from 'typeorm'

import uploadConfig from '../config/upload'

import TransactionsRepository from '../repositories/TransactionsRepository'
import CreateTransactionService from '../services/CreateTransactionService'
// import DeleteTransactionService from '../services/DeleteTransactionService';
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
  const transactionsRepository = getCustomRepository(TransactionsRepository)
  const transaction = await transactionsRepository.findOne(id)

  if (!transaction) {
    const errorMessage = { error: 'Transaction not found' }
    return response.status(400).json(errorMessage)
  }

  await transactionsRepository.remove(transaction)

  return response.status(204).send()
})

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const { filename } = request.file
    const importTransactionsService = new ImportTransactionsService()
    const transactions = await importTransactionsService.execute({ filename })

    console.log(request.body)
    console.log(request.params)
    console.log(request.file.filename)

    return response.json(transactions)
  }
)

export default transactionsRouter
