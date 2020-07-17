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
  private transactionsRepository: TransactionsRepository = getCustomRepository(
    TransactionsRepository
  )

  private categoriesRepository: CategoriesRepository = getCustomRepository(
    CategoriesRepository
  )

  public async execute({ category, ...params }: Request): Promise<Transaction> {
    const { total } = await this.transactionsRepository.getBalance()
    const { value, type } = params
    const isBroken = type === 'outcome' && total - value < 0

    if (isBroken) throw new AppError('You do not have balance')

    const findCategory =
      category && (await this.categoriesRepository.findByTitle(category))

    const transaction = this.transactionsRepository.create({
      ...params,
      category: findCategory || { title: category }
    })

    await this.transactionsRepository.save(transaction)
    return transaction
  }
}

export default CreateTransactionService
