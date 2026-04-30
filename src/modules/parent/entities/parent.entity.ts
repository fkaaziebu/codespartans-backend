import { Exclude } from 'class-transformer';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Child } from './child.entity';

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

  @Field()
  @Column()
  whatsapp_number: string;

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

  @Field(() => [Child], { nullable: true })
  @OneToMany(() => Child, (child) => child.parent)
  children: Child[];
}
