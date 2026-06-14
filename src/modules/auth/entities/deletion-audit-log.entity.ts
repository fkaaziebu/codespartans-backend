import { CreateDateColumn, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum DeletionAuditEvent {
  STUDENT_DELETION_REQUESTED = 'STUDENT_DELETION_REQUESTED',
  STUDENT_DELETION_ALREADY_PENDING = 'STUDENT_DELETION_ALREADY_PENDING',
  STUDENT_DELETION_CANCELLED = 'STUDENT_DELETION_CANCELLED',
  STUDENT_ACCOUNT_PURGED = 'STUDENT_ACCOUNT_PURGED',
  STUDENT_PURGE_FAILED = 'STUDENT_PURGE_FAILED',
  PARENT_DELETION_REQUESTED = 'PARENT_DELETION_REQUESTED',
  PARENT_DELETION_ALREADY_PENDING = 'PARENT_DELETION_ALREADY_PENDING',
  PARENT_DELETION_CANCELLED = 'PARENT_DELETION_CANCELLED',
  PARENT_ACCOUNT_PURGED = 'PARENT_ACCOUNT_PURGED',
  PARENT_PURGE_FAILED = 'PARENT_PURGE_FAILED',
  CHILD_DELETION_REQUESTED = 'CHILD_DELETION_REQUESTED',
  CHILD_DELETION_CANCELLED = 'CHILD_DELETION_CANCELLED',
  CHILD_CASCADE_DEACTIVATED = 'CHILD_CASCADE_DEACTIVATED',
  CHILD_CASCADE_PURGED = 'CHILD_CASCADE_PURGED',
}

export enum AuditAccountType {
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

export interface RequestMetadata {
  ip: string | null;
  userAgent: string | null;
}

export interface PurgeReport {
  profile_deleted: boolean;
  tests_anonymized: number;
  subscriptions_de_identified: number;
  checkouts_deleted: number;
}

@Entity('deletion_audit_logs')
export class DeletionAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: DeletionAuditEvent })
  event: DeletionAuditEvent;

  @Column()
  account_id: string;

  @Column({ type: 'enum', enum: AuditAccountType })
  account_type: AuditAccountType;

  @Column({ type: 'simple-array', nullable: true })
  affected_child_ids: string[] | null;

  @Column({ nullable: true })
  ip_address: string | null;

  @Column({ nullable: true })
  user_agent: string | null;

  @Column({ type: 'jsonb', nullable: true })
  purge_report: PurgeReport | null;

  @CreateDateColumn({ type: 'timestamptz' })
  occurred_at: Date;
}
