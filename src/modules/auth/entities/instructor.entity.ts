import { Exclude } from 'class-transformer';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Course } from '../../inventory/entities/course.entity';
import { Organization } from './organization.entity';

export enum InstructorStatusType {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

registerEnumType(InstructorStatusType, {
  name: 'InstructorStatusType',
  description: 'Instructor status',
});

@ObjectType('Instructor')
@Entity('instructors')
export class Instructor {
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

  @Field(() => InstructorStatusType)
  @Column({
    type: 'enum',
    enum: InstructorStatusType,
    default: InstructorStatusType.ACTIVE,
  })
  status: InstructorStatusType;

  @Field(() => [Organization], { nullable: true })
  @ManyToMany(() => Organization, (organization) => organization.instructors)
  @JoinTable()
  organizations: Organization[];

  @Field(() => [Course], { nullable: true })
  @OneToMany(() => Course, (course) => course.instructor)
  created_courses: Course[];
}
