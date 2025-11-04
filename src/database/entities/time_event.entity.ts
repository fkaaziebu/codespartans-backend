import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Test } from './test.entity';

export enum TimeEventType {
  STARTED = 'STARTED',
  PAUSED = 'PAUSED',
  RESUMED = 'RESUMED',
  ENDED = 'ENDED',
}

@Entity('time_events')
export class TimeEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TimeEventType,
    default: TimeEventType.STARTED,
  })
  type: TimeEventType;

  @Column()
  recorded_at: Date;

  @ManyToOne(() => Test, (test) => test.time_events)
  test: Test;
}
