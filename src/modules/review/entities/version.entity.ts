import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
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
import { Admin } from '../../auth/entities/admin.entity';
import { Course } from '../../inventory/entities/course.entity';
import { Question } from './question.entity';
import { Review } from './review.entity';
import { ReviewRequest } from './review_request.entity';
import { TestSuite } from './test_suite.entity';

export enum VersionStatusType {
  ARCHIVED = 'ARCHIVED',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

registerEnumType(VersionStatusType, {
  name: 'VersionStatusType',
  description: 'Version status',
});

@ObjectType('Version')
@Entity('versions')
export class Version {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Int)
  @Column()
  version_number: number;

  @Field(() => VersionStatusType)
  @Column({
    type: 'enum',
    enum: VersionStatusType,
    default: VersionStatusType.PENDING,
  })
  status: VersionStatusType;

  @Field(() => ReviewRequest, { nullable: true })
  @OneToOne(
    () => ReviewRequest,
    (reviewRequest) => reviewRequest.course_version,
  )
  review_request: ReviewRequest;

  @Field(() => Admin, { nullable: true })
  @ManyToOne(
    () => Admin,
    (course) => course.assigned_course_versions_for_review,
  )
  assigned_admin: Admin;

  @Field(() => Course, { nullable: true })
  @ManyToOne(() => Course, (course) => course.versions)
  course: Course;

  @Field(() => [Review], { nullable: true })
  @OneToMany(() => Review, (review) => review.course_version)
  reviews: Review[];

  @Field(() => [Question], { nullable: true })
  @OneToMany(() => Question, (question) => question.version)
  questions: Question[];

  @Field(() => [TestSuite], { nullable: true })
  @OneToMany(() => TestSuite, (test_suite) => test_suite.course_version)
  test_suites: TestSuite[];

  @Field()
  @CreateDateColumn()
  inserted_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;
}
