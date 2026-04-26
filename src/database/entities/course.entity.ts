import { Field, Float, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
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

export enum DomainType {
  SCIENCE = 'SCIENCE',
  ENGLISH = 'ENGLISH',
  MATHEMATICS = 'MATHEMATICS',
}

export enum LevelType {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum CurrencyType {
  USD = 'USD',
  EUR = 'EUR',
}

registerEnumType(DomainType, {
  name: 'DomainType',
  description: 'Course domains',
});

registerEnumType(LevelType, {
  name: 'LevelType',
  description: 'Course level',
});

registerEnumType(CurrencyType, {
  name: 'CurrencyType',
  description: 'Currency',
});

@ObjectType('Course')
@Entity('courses')
export class Course {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column()
  avatar_url: string;

  @Field()
  @Column()
  description: string;

  @Field()
  @Column({ default: false })
  is_mandatory: boolean;

  @Field(() => [DomainType])
  @Column({
    type: 'enum',
    enum: DomainType,
    array: true,
    default: [DomainType.SCIENCE],
  })
  domains: DomainType[];

  @Field(() => LevelType)
  @Column({
    type: 'enum',
    enum: LevelType,
    default: LevelType.BEGINNER,
  })
  level: LevelType;

  @Field(() => Float)
  @Column({ type: 'float' })
  price: number;

  @Field(() => CurrencyType)
  @Column({
    type: 'enum',
    enum: CurrencyType,
    default: CurrencyType.USD,
  })
  currency: CurrencyType;

  @Field(() => [Version], { nullable: true })
  @OneToMany(() => Version, (version) => version.course)
  versions: Version[];

  @Field(() => Version, { nullable: true })
  @OneToOne(() => Version)
  @JoinColumn()
  approved_version: Version;

  @Field(() => [Coupon], { nullable: true })
  @ManyToMany(() => Coupon)
  @JoinTable()
  coupons: Coupon[];

  @Field(() => [Category], { nullable: true })
  @ManyToMany(() => Category, (category) => category.courses)
  categories: Category[];

  @Field(() => [Student], { nullable: true })
  @ManyToMany(() => Student, (student) => student.subscribed_courses)
  subscribed_students: Student[];

  @Field(() => Organization, { nullable: true })
  @ManyToOne(
    () => Organization,
    (organization) => organization.organizational_courses,
  )
  organization: Organization;

  @Field(() => Instructor, { nullable: true })
  @ManyToOne(() => Instructor, (instructor) => instructor.created_courses)
  instructor: Instructor;

  @Field()
  @CreateDateColumn()
  inserted_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;
}
