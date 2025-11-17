import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { Coupon } from './coupon.entity';
import { Instructor } from './instructor.entity';
import { Organization } from './organization.entity';
import { Student } from './student.entity';
import { Version } from './version.entity';

enum DomainType {
  SCIENCE = 'SCIENCE',
  ENGLISH = 'ENGLISH',
  MATHEMATICS = 'MATHEMATICS',
}

enum LevelType {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

enum CurrencyType {
  USD = 'USD',
  EUR = 'EUR',
}

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  avatar_url: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: DomainType,
    array: true,
    default: [DomainType.SCIENCE],
  })
  domains: DomainType[];

  @Column({
    type: 'enum',
    enum: LevelType,
    default: LevelType.BEGINNER,
  })
  level: LevelType;

  @Column({ type: 'float' })
  price: number;

  @Column({
    type: 'enum',
    enum: CurrencyType,
    default: CurrencyType.USD,
  })
  currency: CurrencyType;

  @OneToMany(() => Version, (version) => version.course)
  versions: Version[];

  @OneToOne(() => Version)
  @JoinColumn()
  approved_version: Version;

  @ManyToMany(() => Coupon)
  @JoinTable()
  coupons: Coupon[];

  @ManyToMany(() => Category, (category) => category.courses)
  categories: Category[];

  @ManyToMany(() => Student, (student) => student.subscribed_courses)
  subscribed_students: Student[];

  @ManyToOne(
    () => Organization,
    (organization) => organization.organizational_courses,
  )
  organization: Organization;

  @ManyToOne(() => Instructor, (instructor) => instructor.created_courses)
  instructor: Instructor;

  @CreateDateColumn()
  inserted_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
