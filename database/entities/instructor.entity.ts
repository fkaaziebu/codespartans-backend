import { Exclude } from 'class-transformer';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Course } from './course.entity';
import { Organization } from './organization.entity';

@Entity('instructors')
export class Instructor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @ManyToMany(() => Organization, (organization) => organization.instructors)
  @JoinTable()
  organizations: Organization[];

  @OneToMany(() => Course, (course) => course.instructor)
  created_courses: Course[];
}
