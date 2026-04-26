import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Entity,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { Course } from './course.entity';
import { Student } from './student.entity';

@ObjectType('Cart')
@Entity('carts')
export class Cart {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Student, { nullable: true })
  @OneToOne(() => Student, (student) => student.cart)
  student: Student;

  @Field(() => [Course], { nullable: true })
  @ManyToMany(() => Course)
  @JoinTable()
  courses: Course[];

  @Field(() => [Category], { nullable: true })
  @ManyToMany(() => Category)
  @JoinTable()
  categories: Category[];
}
