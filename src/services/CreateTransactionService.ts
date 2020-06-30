import { getCustomRepository } from 'typeorm'

// import AppError from '../errors/AppError';
import Transaction from '../models/Transaction'
import TransactionsRepository from '../repositories/TransactionsRepository'

interface Request {
  title: string
  value: number
  type: 'income' | 'outcome'
  category_id: string
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category_id
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository)

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id
    })

    await transactionsRepository.save(transaction)

    return transaction
  }
}

export default CreateTransactionService
