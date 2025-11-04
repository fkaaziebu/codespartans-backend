import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Issue } from './issue.entity';
import { Version } from './version.entity';

enum ReviewStatusType {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({
    type: 'enum',
    enum: ReviewStatusType,
    default: ReviewStatusType.OPEN,
  })
  status: ReviewStatusType;

  @ManyToOne(() => Version, (version) => version.reviews)
  course_version: Version;

  @OneToMany(() => Issue, (issue) => issue.review)
  issues: Issue[];

  @CreateDateColumn()
  inserted_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
