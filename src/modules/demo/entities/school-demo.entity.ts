import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum SchoolDemoRole {
  PROPRIETOR_OWNER = 'proprietor_owner',
  HEADMASTER_PRINCIPAL = 'headmaster_principal',
  ACADEMIC_DIRECTOR = 'academic_director',
  TEACHER = 'teacher',
  OTHER = 'other',
}

export enum ApproximateStudents {
  UNDER_50 = 'under_50',
  BETWEEN_50_AND_100 = '50_to_100',
  BETWEEN_100_AND_300 = '100_to_300',
  BETWEEN_300_AND_500 = '300_to_500',
  ABOVE_500 = 'above_500',
}

export enum DemoStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CONVERTED = 'converted',
}

registerEnumType(SchoolDemoRole, { name: 'SchoolDemoRole' });
registerEnumType(ApproximateStudents, { name: 'ApproximateStudents' });
registerEnumType(DemoStatus, { name: 'DemoStatus' });

@ObjectType('SchoolDemo')
@Entity('school_demos')
export class SchoolDemo {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  school_name: string;

  @Field(() => SchoolDemoRole)
  @Column({ type: 'enum', enum: SchoolDemoRole })
  role: SchoolDemoRole;

  @Field(() => ApproximateStudents)
  @Column({ type: 'enum', enum: ApproximateStudents })
  approximate_students: ApproximateStudents;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field()
  @Column()
  whatsapp_number: string;

  @Field()
  @Column({ unique: true })
  demo_code: string;

  @Field(() => DemoStatus)
  @Column({ type: 'enum', enum: DemoStatus, default: DemoStatus.PENDING })
  status: DemoStatus;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'timestamptz' })
  activated_at: Date;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'timestamptz' })
  expires_at: Date;

  @Field()
  @Column({ default: 14 })
  trial_duration_days: number;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
