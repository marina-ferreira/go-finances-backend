import fs from 'fs'
import path from 'path'
import csvParse from 'csv-parse'
import { getCustomRepository } from 'typeorm'

import CategoriesRepository from '../repositories/CategoriesRepository'
import TransactionsRepository from '../repositories/TransactionsRepository'
import Transaction from '../models/Transaction'
import Category from '../models/Category'
import AppError from '../errors/AppError'

interface TransactionData {
  title: string
  type: 'income' | 'outcome'
  value: number
  categoryTitle?: string
}

interface TransactionBuilder {
  transaction: TransactionData
  categories: Category[]
}

class ImportTransactionsService {
  private categoriesRepository: CategoriesRepository = getCustomRepository(
    CategoriesRepository
  )

  private transactionsRepository: TransactionsRepository = getCustomRepository(
    TransactionsRepository
  )

  async execute(filename: string): Promise<Transaction[]> {
    const transactions = await this.loadCsv(filename)
    return this.createTransactions(transactions)
  }

  private async loadCsv(filename: string): Promise<TransactionData[]> {
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', filename)
    const readCSVStream = fs.createReadStream(csvFilePath)
    const parseStream = csvParse({ from_line: 2, ltrim: true, rtrim: true })
    const parseCSV = readCSVStream.pipe(parseStream)
    const transactions: TransactionData[] = []

    parseCSV.on('data', line => {
      const [title, type, value, categoryTitle] = line
      transactions.push({ title, type, value, categoryTitle })
    })

    await new Promise(resolve => parseCSV.on('end', resolve))

    fs.unlink(csvFilePath, () => ({}))
    return transactions
  }

  private async createTransactions(
    transactions: TransactionData[]
  ): Promise<Transaction[]> {
    const categoryTitles = this.getCategoryTitles(transactions)
    const categories = await this.categoriesRepository.findByTitles(
      categoryTitles
    )

    const newTransactions: Transaction[] = this.transactionsRepository.create(
      transactions.map(transaction =>
        this.buildTransaction({ transaction, categories })
      )
    )

    await this.transactionsRepository.save(newTransactions)
    return newTransactions
  }

  private getCategoryTitles(transactions: TransactionData[]): string[] {
    return transactions
      .filter(transaction => transaction.categoryTitle)
      .map(transaction => transaction.categoryTitle?.trim() ?? '')
  }

  private buildTransaction({
    transaction,
    categories
  }: TransactionBuilder): TransactionData {
    this.validateTransaction(transaction)

    const { categoryTitle } = transaction
    const category =
      categories.find(
        ({ title }: { title: string }) => title === categoryTitle
      ) || (categoryTitle as string)

    return { ...transaction, category }
  }

  private validateTransaction(transaction: TransactionData): void {
    const isValid = Object.keys(transaction).every(
      key => transaction[key as keyof TransactionData]
    )
    if (!isValid) throw new AppError('Missing transaction data', 422)
  }
}

export default ImportTransactionsService
