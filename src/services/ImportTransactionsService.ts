import fs from 'fs'
import path from 'path'
import csvParse from 'csv-parse'
import { getRepository, getCustomRepository, Repository } from 'typeorm'

import TransactionsRepository from '../repositories/TransactionsRepository'
import Transaction from '../models/Transaction'
import Category from '../models/Category'

interface Request {
  filename: string
}

class ImportTransactionsService {
  private transactions: Transaction[] = []

  private transactionsRepository: TransactionsRepository = getCustomRepository(
    TransactionsRepository
  )

  private categoriesRepository: Repository<Category> = getRepository(Category)

  async execute({ filename }: Request): Promise<Transaction[]> {
    return this.loadCsv(filename)
  }

  private async loadCsv(filename: string): Promise<Transaction[]> {
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', filename)
    const readCSVStream = fs.createReadStream(csvFilePath)
    const parseStream = csvParse({ from_line: 2, ltrim: true, rtrim: true })
    const parseCSV = readCSVStream.pipe(parseStream)

    parseCSV.on('data', line => this.createTransaction(line))

    await new Promise(resolve => parseCSV.on('end', resolve))

    return this.transactions
  }

  private async createTransaction(
    params: [string, 'income' | 'outcome', number, Category | string]
  ): Promise<void> {
    const [title, type, value, category] = params
    const findCategory = await this.categoriesRepository.findOne({
      where: { title: category }
    })

    const transaction: Transaction = this.transactionsRepository.create({
      title,
      value: Number(value),
      type,
      category: findCategory || { title: category as string }
    })

    console.log(transaction)
    this.transactions.push(transaction)
    await this.transactionsRepository.save(transaction)
  }
}

export default ImportTransactionsService
