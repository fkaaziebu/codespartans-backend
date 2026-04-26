import { Exclude } from 'class-transformer';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Admin } from './admin.entity';
import { Category } from './category.entity';
import { Coupon } from './coupon.entity';
import { Course } from './course.entity';
import { Instructor } from './instructor.entity';
import { ReviewRequest } from './review_request.entity';
import { Student } from './student.entity';

@ObjectType('Organization')
@Entity('organizations')
export class Organization {
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

  @Field(() => [Admin], { nullable: true })
  @OneToMany(() => Admin, (admin) => admin.organization)
  admins: Admin[];

  @Field(() => [Instructor], { nullable: true })
  @ManyToMany(() => Instructor, (course) => course.organizations)
  instructors: Instructor[];

  @Field(() => [Student], { nullable: true })
  @ManyToMany(() => Student, (student) => student.organizations)
  students: Student[];

  @Field(() => [Course], { nullable: true })
  @OneToMany(() => Course, (course) => course.organization)
  organizational_courses: Course[];

  @Field(() => [Category], { nullable: true })
  @OneToMany(() => Category, (category) => category.organization)
  organizational_categories: Category[];

  @Field(() => [Coupon], { nullable: true })
  @OneToMany(() => Coupon, (coupon) => coupon.organization)
  organizational_coupons: Coupon[];

  @Field(() => [ReviewRequest], { nullable: true })
  @OneToMany(() => ReviewRequest, (review_req) => review_req.organization)
  requested_reviews: ReviewRequest[];
}
