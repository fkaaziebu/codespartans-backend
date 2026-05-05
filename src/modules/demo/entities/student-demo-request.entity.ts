import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@ObjectType('StudentDemoRequest')
@Entity('student_demo_requests')
export class StudentDemoRequest {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  full_name: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field()
  @Column()
  target_exam: string;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
