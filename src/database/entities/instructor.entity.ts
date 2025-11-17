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

enum InstructorStatusType {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

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

  @Column({
    type: 'enum',
    enum: InstructorStatusType,
    default: InstructorStatusType.ACTIVE,
  })
  status: InstructorStatusType;

  @ManyToMany(() => Organization, (organization) => organization.instructors)
  @JoinTable()
  organizations: Organization[];

  @OneToMany(() => Course, (course) => course.instructor)
  created_courses: Course[];
}
