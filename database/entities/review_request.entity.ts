import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Version } from './version.entity';

@Entity('review_requests')
export class ReviewRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, (version) => version.requested_reviews)
  organization: Organization;

  @OneToOne(() => Version, (version) => version.review_request)
  @JoinColumn()
  course_version: Version;

  @CreateDateColumn()
  inserted_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
