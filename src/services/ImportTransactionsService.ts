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
  category?: Category | string
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
    const categories = await this.createCategories(transactions)
    return this.createTransactions(transactions, categories)
  }

  private async loadCsv(filename: string): Promise<TransactionData[]> {
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', filename)
    const readCSVStream = fs.createReadStream(csvFilePath)
    const parseStream = csvParse({ from_line: 2, ltrim: true, rtrim: true })
    const parseCSV = readCSVStream.pipe(parseStream)
    const transactions: TransactionData[] = []

    parseCSV.on('data', line => {
      const [title, type, value, category] = line
      transactions.push({ title, type, value, category })
    })

    await new Promise(resolve => parseCSV.on('end', resolve))

    fs.unlink(csvFilePath, () => ({}))
    return transactions
  }

  private async createCategories(
    transactions: TransactionData[]
  ): Promise<Category[]> {
    const categoryTitles = this.getCategoryTitles(transactions)
    const categories = await this.categoriesRepository.findByTitles(
      categoryTitles
    )

    const foundCategoryTitles = categories.map(({ title }) => title)
    const newCategoriesTitles = categoryTitles
      .filter(title => !foundCategoryTitles.includes(title))
      .filter((value, index, self) => self.indexOf(value) === index)
      .map(title => ({ title }))

    const newCategories = this.categoriesRepository.create(newCategoriesTitles)
    await this.categoriesRepository.save(newCategories)

    return [...categories, ...newCategories]
  }

  private async createTransactions(
    transactions: TransactionData[],
    categories: Category[]
  ): Promise<Transaction[]> {
    const transactionsData = transactions.map(transaction => {
      const category = categories.find(
        ({ title }) => title === transaction.category
      )

      return { ...transaction, category }
    })
    const newTransactions = this.transactionsRepository.create(transactionsData)

    await this.transactionsRepository.save(newTransactions)

    return newTransactions
  }

  private getCategoryTitles(transactions: TransactionData[]): string[] {
    return transactions.map(
      ({ category }) => (category as string)?.trim() ?? ''
    )
  }
}

export default ImportTransactionsService
