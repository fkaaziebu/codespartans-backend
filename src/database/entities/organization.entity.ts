import { Exclude } from 'class-transformer';
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

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @OneToMany(() => Admin, (admin) => admin.organization)
  admins: Admin[];

  @ManyToMany(() => Instructor, (course) => course.organizations)
  instructors: Instructor[];

  @ManyToMany(() => Student, (student) => student.organizations)
  students: Student[];

  @OneToMany(() => Course, (course) => course.organization)
  organizational_courses: Course[];

  @OneToMany(() => Category, (category) => category.organization)
  organizational_categories: Category[];

  @OneToMany(() => Coupon, (coupon) => coupon.organization)
  organizational_coupons: Coupon[];

  @OneToMany(() => ReviewRequest, (review_req) => review_req.organization)
  requested_reviews: ReviewRequest[];
}
