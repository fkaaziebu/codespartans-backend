import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Review } from './review.entity';

enum IssueStatusType {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

@Entity('issues')
export class Issue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: IssueStatusType,
    default: IssueStatusType.OPEN,
  })
  status: IssueStatusType;

  @Column({ default: null })
  response: string;

  @ManyToOne(() => Review, (review) => review.issues)
  review: Review;
}
