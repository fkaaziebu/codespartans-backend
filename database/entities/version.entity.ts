import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Admin } from './admin.entity';
import { Course } from './course.entity';
import { Question } from './question.entity';
import { Review } from './review.entity';
import { ReviewRequest } from './review_request.entity';
import { TestSuite } from './test_suite.entity';

enum VersionStatusType {
  ARCHIVED = 'ARCHIVED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('versions')
export class Version {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  version_number: number;

  @Column({
    type: 'enum',
    enum: VersionStatusType,
    default: VersionStatusType.PENDING,
  })
  status: VersionStatusType;

  @OneToOne(
    () => ReviewRequest,
    (reviewRequest) => reviewRequest.course_version,
  )
  review_request: ReviewRequest;

  @ManyToOne(
    () => Admin,
    (course) => course.assigned_course_versions_for_review,
  )
  assigned_admin: Admin;

  @ManyToOne(() => Course, (course) => course.versions)
  course: Course;

  @OneToMany(() => Review, (review) => review.course_version)
  reviews: Review[];

  @OneToMany(() => Question, (question) => question.version)
  questions: Question[];

  @OneToMany(() => TestSuite, (test_suite) => test_suite.course_version)
  test_suites: TestSuite[];

  @CreateDateColumn()
  inserted_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
