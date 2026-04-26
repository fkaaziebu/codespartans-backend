import { Exclude } from 'class-transformer';
import { Field, ID, ObjectType } from '@nestjs/graphql';
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

@ObjectType('Student')
@Entity('students')
export class Student {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ nullable: true })
  reset_token: string;

  @Field()
  @Column({ default: false })
  is_setup_completed: boolean;

  @Column({ default: false })
  is_account_validated: boolean;

  @Column({ nullable: true })
  validation_code: string;

  @Field(() => [Course], { nullable: true })
  @ManyToMany(() => Course)
  @JoinTable()
  subscribed_courses: Course[];

  @Field(() => [Category], { nullable: true })
  @ManyToMany(() => Category)
  @JoinTable()
  subscribed_categories: Category[];

  @Field(() => [Organization], { nullable: true })
  @ManyToMany(() => Organization, (organization) => organization.students)
  @JoinTable()
  organizations: Organization[];

  @Field(() => [Checkout], { nullable: true })
  @OneToMany(() => Checkout, (payment) => payment.student)
  checkouts: Checkout[];

  @Field(() => Cart, { nullable: true })
  @OneToOne(() => Cart, (cart) => cart.student)
  @JoinColumn()
  cart: Cart;

  @OneToMany(() => Test, (test) => test.student)
  tests: Test[];
}
