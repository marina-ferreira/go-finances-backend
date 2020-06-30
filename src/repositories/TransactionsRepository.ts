import { EntityRepository, Repository } from 'typeorm'

import Transaction from '../models/Transaction'

interface Balance {
  income: number
  outcome: number
  total: number
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find()

    const balance = transactions.reduce(
      (acc, transaction) => {
        acc[transaction.type] += transaction.value
        return acc
      },
      { income: 0, outcome: 0 }
    )

    const { income, outcome } = balance
    return { ...balance, total: income - outcome }
  }
}

export default TransactionsRepository
