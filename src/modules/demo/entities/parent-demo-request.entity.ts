import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@ObjectType('ParentDemoRequest')
@Entity('parent_demo_requests')
export class ParentDemoRequest {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  full_name: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field(() => [String])
  @Column({ type: 'text', array: true })
  target_exams: string[];

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
