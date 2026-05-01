import { Exclude } from 'class-transformer';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Student } from '../../auth/entities/student.entity';
import { Parent } from './parent.entity';

export enum ClassLevel {
  JHS1 = 'JHS1',
  JHS2 = 'JHS2',
  JHS3 = 'JHS3',
  SHS1 = 'SHS1',
  SHS2 = 'SHS2',
  SHS3 = 'SHS3',
}

registerEnumType(ClassLevel, {
  name: 'ClassLevel',
  description: 'Student class level',
});

@ObjectType('Child')
@Entity('children')
export class Child {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  full_name: string;

  @Field(() => ClassLevel)
  @Column({
    type: 'enum',
    enum: ClassLevel,
  })
  class_level: ClassLevel;

  @Field()
  @Column({ type: 'uuid' })
  target_exam: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  school_name: string;

  @Field({ nullable: true })
  @Column({ unique: true, nullable: true })
  username: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  pin: string;

  @Field(() => Parent, { nullable: true })
  @ManyToOne(() => Parent, (parent) => parent.children)
  parent: Parent;

  @Field(() => Student, { nullable: true })
  @OneToOne(() => Student, { nullable: true })
  @JoinColumn()
  student: Student;
}
