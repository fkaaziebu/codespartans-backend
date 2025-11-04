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

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Student, (student) => student.cart)
  student: Student;

  @ManyToMany(() => Course)
  @JoinTable()
  courses: Course[];

  @ManyToMany(() => Category)
  @JoinTable()
  categories: Category[];
}
