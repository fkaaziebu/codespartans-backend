import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Course } from './course.entity';
import { Organization } from '../../auth/entities/organization.entity';
import { Student } from '../../auth/entities/student.entity';

export enum CategoryGradingSystemType {
  WASSCE = 'WASSCE',
  BECE = 'BECE',
  NONE = 'NONE',
}

registerEnumType(CategoryGradingSystemType, {
  name: 'CategoryGradingSystemType',
  description: 'Grading system used to compute a predicted aggregate',
});

@ObjectType('Category')
@Entity('categories')
export class Category {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  avatar_url: string;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'date', nullable: true })
  date_of_exams: Date | null;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  exam_duration_days: number | null;

  @Field(() => CategoryGradingSystemType)
  @Column({
    type: 'enum',
    enum: CategoryGradingSystemType,
    default: CategoryGradingSystemType.NONE,
  })
  grading_system: CategoryGradingSystemType;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(
    () => Organization,
    (organization) => organization.organizational_categories,
  )
  organization: Organization;

  @Field(() => [Student], { nullable: true })
  @ManyToMany(() => Student, (student) => student.subscribed_categories)
  subscribed_students: Student[];

  @Field(() => [Course], { nullable: true })
  @ManyToMany(() => Course, (course) => course.categories)
  @JoinTable()
  courses: Course[];
}
