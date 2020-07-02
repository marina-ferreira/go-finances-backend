import fs from 'fs'
import path from 'path'
import csvParse from 'csv-parse'
import { getRepository, getCustomRepository, Repository, In } from 'typeorm'

import TransactionsRepository from '../repositories/TransactionsRepository'
import Transaction from '../models/Transaction'
import Category from '../models/Category'

interface Request {
  filename: string
}

class ImportTransactionsService {
  private transactionsRepository: TransactionsRepository = getCustomRepository(
    TransactionsRepository
  )

  private categoriesRepository: Repository<Category> = getRepository(Category)

  async execute({ filename }: Request): Promise<Transaction[]> {
    const transactions = await this.loadCsv(filename)
    return this.createTransactions(transactions)
  }

  private async loadCsv(filename: string): Promise<Transaction[]> {
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', filename)
    const readCSVStream = fs.createReadStream(csvFilePath)
    const parseStream = csvParse({ from_line: 2, ltrim: true, rtrim: true })
    const parseCSV = readCSVStream.pipe(parseStream)
    const transactions: Transaction[] = []

    parseCSV.on('data', line => {
      const [title, type, value, category] = line
      transactions.push({ title, type, value, category })
    })

    await new Promise(resolve => parseCSV.on('end', resolve))

    return transactions
  }

  private async createTransactions(transactions: Transaction[]) {
    const categories = transactions
      .map(transaction => transaction.category.trim())
      .filter(String)

    const findCategories = await this.categoriesRepository.find({
      where: { title: In(categories) }
    })

    const newTransactions: Transaction[] = this.transactionsRepository.create(
      transactions.map(({ title, type, value, category }) => ({
        title,
        type,
        value,
        category: findCategories.find(
          ({ title: categoryTitle }) => categoryTitle === String(category)
        ) || { title: String(category) }
      }))
    )

    await this.transactionsRepository.save(newTransactions)
    return newTransactions
  }
}

export default ImportTransactionsService
