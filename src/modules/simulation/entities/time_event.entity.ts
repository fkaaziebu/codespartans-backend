import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Test } from './test.entity';

export enum TimeEventType {
  STARTED = 'STARTED',
  PAUSED = 'PAUSED',
  RESUMED = 'RESUMED',
  ENDED = 'ENDED',
}

registerEnumType(TimeEventType, {
  name: 'TimeEventType',
  description: 'Time event type',
});

@ObjectType('TimeEvent')
@Entity('time_events')
export class TimeEvent {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => TimeEventType)
  @Column({
    type: 'enum',
    enum: TimeEventType,
    default: TimeEventType.STARTED,
  })
  type: TimeEventType;

  @Field()
  @Column()
  recorded_at: Date;

  @Field(() => Test, { nullable: true })
  @ManyToOne(() => Test, (test) => test.time_events)
  test: Test;
}
