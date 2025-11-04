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

@Entity('checkouts')
export class Checkout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, (student) => student.checkouts)
  student: Student;

  @ManyToMany(() => Course)
  @JoinTable()
  courses: Course[];

  @ManyToMany(() => Category)
  @JoinTable()
  categories: Category[];
}
