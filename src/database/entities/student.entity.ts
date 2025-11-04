import { Exclude } from 'class-transformer';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Category } from './category.entity';
import { Checkout } from './checkout.entity';
import { Course } from './course.entity';
import { Organization } from './organization.entity';
import { Test } from './test.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @ManyToMany(() => Course)
  @JoinTable()
  subscribed_courses: Course[];

  @ManyToMany(() => Category)
  @JoinTable()
  subscribed_categories: Category[];

  @ManyToMany(() => Organization, (organization) => organization.students)
  @JoinTable()
  organizations: Organization[];

  @OneToMany(() => Checkout, (payment) => payment.student)
  checkouts: Checkout[];

  @OneToOne(() => Cart, (cart) => cart.student)
  @JoinColumn()
  cart: Cart;

  @OneToMany(() => Test, (test) => test.student)
  tests: Test[];
}
