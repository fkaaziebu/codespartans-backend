import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Test } from './test.entity';

@ObjectType('Recommendation')
@Entity('recommendations')
export class Recommendation {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  description: string;

  @ManyToOne(() => Test, (test) => test.recommendations)
  test: Test;
}
