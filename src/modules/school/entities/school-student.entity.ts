import { Exclude } from 'class-transformer';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from '../../auth/entities/organization.entity';
import { Student } from '../../auth/entities/student.entity';
import { ClassLevel } from '../../parent/entities/child.entity';

@ObjectType('SchoolStudent')
@Entity('school_students')
export class SchoolStudent {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  full_name: string;

  @Field(() => ClassLevel)
  @Column({ type: 'enum', enum: ClassLevel })
  class_level: ClassLevel;

  @Field()
  @Column({ type: 'uuid' })
  target_exam: string;

  @Field({ nullable: true })
  @Column({ unique: true, nullable: true })
  username: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  pin: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  organization: Organization;

  @Field(() => Student, { nullable: true })
  @OneToOne(() => Student, { nullable: true })
  @JoinColumn()
  student: Student;
}
