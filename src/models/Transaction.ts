import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm'

import Category from './Category'

@Entity('transactions')
class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column()
  type: 'income' | 'outcome'

  @Column()
  value: number

  @Column()
  category_id: string

  @ManyToOne(() => Category, category => category.transaction, {
    cascade: true,
    eager: true
  })
  @JoinColumn({ name: 'category_id' })
  category: Category | string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}

export default Transaction
