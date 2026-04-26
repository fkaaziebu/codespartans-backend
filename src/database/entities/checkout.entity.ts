import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { Course } from './course.entity';
import { Student } from './student.entity';

@ObjectType('Checkout')
@Entity('checkouts')
export class Checkout {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Student, { nullable: true })
  @ManyToOne(() => Student, (student) => student.checkouts)
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
