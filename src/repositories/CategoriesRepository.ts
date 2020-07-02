import { EntityRepository, Repository, In } from 'typeorm'

import Category from '../models/Category'

@EntityRepository(Category)
class CategoriesRepository extends Repository<Category> {
  public async findByTitle(category: string): Promise<Category | undefined> {
    return this.findOne({ where: { title: category } })
  }

  public async findByTitles(categories: string[]): Promise<Category[]> {
    return this.find({ where: { title: In(categories) } })
  }
}

export default CategoriesRepository
