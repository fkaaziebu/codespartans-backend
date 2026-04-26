import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Course } from './course.entity';
import { Organization } from './organization.entity';
import { Student } from './student.entity';

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
