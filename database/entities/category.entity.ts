import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Course } from './course.entity';
import { Organization } from './organization.entity';
import { Student } from './student.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  avatar_url: string;

  @ManyToOne(
    () => Organization,
    (organization) => organization.organizational_categories,
  )
  organization: Organization;

  @ManyToMany(() => Student, (student) => student.subscribed_categories)
  subscribed_students: Student[];

  @ManyToMany(() => Course, (course) => course.categories)
  @JoinTable()
  courses: Course[];
}
