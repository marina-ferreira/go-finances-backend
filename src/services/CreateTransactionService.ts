import { getCustomRepository } from 'typeorm'

import Transaction from '../models/Transaction'
import CategoriesRepository from '../repositories/CategoriesRepository'
import TransactionsRepository from '../repositories/TransactionsRepository'
import AppError from '../errors/AppError'

interface Request {
  title: string
  value: number
  type: 'income' | 'outcome'
  category?: string
}

class CreateTransactionService {
  public async execute({ category, ...params }: Request): Promise<Transaction> {
    this.validateTransaction(params)

    const transactionsRepository = getCustomRepository(TransactionsRepository)
    const categoriesRepository = getCustomRepository(CategoriesRepository)
    const findCategory =
      category && (await categoriesRepository.findByTitle(category))

    const transaction = transactionsRepository.create({
      ...params,
      category: findCategory || { title: category }
    })

    await transactionsRepository.save(transaction)
    return transaction
  }

  private validateTransaction(params: Request): void {
    const isValid = Object.keys(params).every(key => params[key])
    if (!isValid) throw new AppError('Missing transaction data', 422)
  }
}

export default CreateTransactionService
