import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Child } from '../../parent/entities/child.entity';
import { Parent } from '../../parent/entities/parent.entity';
import { TestSuite } from '../../review/entities/test_suite.entity';
import { Test } from './test.entity';

export enum TestAssignmentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

registerEnumType(TestAssignmentStatus, {
  name: 'TestAssignmentStatus',
  description: 'Test assignment status',
});

@ObjectType('TestAssignment')
@Entity('test_assignments')
export class TestAssignment {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => TestAssignmentStatus)
  @Column({
    type: 'enum',
    enum: TestAssignmentStatus,
    default: TestAssignmentStatus.PENDING,
  })
  status: TestAssignmentStatus;

  @Field()
  @CreateDateColumn()
  assigned_at: Date;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'timestamp' })
  completed_at: Date;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  note: string;

  @Field(() => Parent, { nullable: true })
  @ManyToOne(() => Parent)
  parent: Parent;

  @Field(() => Child, { nullable: true })
  @ManyToOne(() => Child)
  child: Child;

  @Field(() => TestSuite, { nullable: true })
  @ManyToOne(() => TestSuite)
  test_suite: TestSuite;

  @Field(() => Test, { nullable: true })
  @OneToOne(() => Test, { nullable: true })
  @JoinColumn()
  test: Test;
}
