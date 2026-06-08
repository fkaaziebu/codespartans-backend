import { Exclude } from 'class-transformer';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Child } from './child.entity';

export enum Gender {
  Male = 'Male',
  Female = 'Female',
}

registerEnumType(Gender, {
  name: 'Gender',
  description: 'Parent gender',
});

@ObjectType('Parent')
@Entity('parents')
export class Parent {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  first_name: string;

  @Field()
  @Column()
  last_name: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  whatsapp_number: string;

  @Field(() => Gender)
  @Column({ type: 'enum', enum: Gender, default: Gender.Male })
  gender: Gender;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ default: false })
  is_account_validated: boolean;

  @Field()
  @Column({ default: false })
  is_setup_completed: boolean;

  @Column({ nullable: true })
  validation_code: string;

  @Column({ nullable: true })
  reset_token: string;

  @Field(() => [Child], { nullable: true })
  @OneToMany(() => Child, (child) => child.parent)
  children: Child[];

  @Column({ default: false })
  is_deactivated: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deactivated_at: Date | null;

  @Column({ nullable: true })
  deletion_job_id: string | null;
}
