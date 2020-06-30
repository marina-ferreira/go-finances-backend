import { getRepository, getCustomRepository } from 'typeorm'

// import AppError from '../errors/AppError';
import Category from '../models/Category'
import Transaction from '../models/Transaction'
import TransactionsRepository from '../repositories/TransactionsRepository'

interface Request {
  title: string
  value: number
  type: 'income' | 'outcome'
  category: string
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository)
    const categoriesRepository = getRepository(Category)
    const findCategory = await categoriesRepository.findOne({
      where: { title: category }
    })

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: findCategory || { title: category }
    })

    await transactionsRepository.save(transaction)

    return transaction
  }
}

export default CreateTransactionService
