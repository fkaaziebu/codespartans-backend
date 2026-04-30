import { Exclude } from 'class-transformer';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Version } from '../../review/entities/version.entity';

export enum AdminStatusType {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

registerEnumType(AdminStatusType, {
  name: 'AdminStatusType',
  description: 'Admin status',
});

@ObjectType('Admin')
@Entity('admins')
export class Admin {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Field(() => AdminStatusType)
  @Column({
    type: 'enum',
    enum: AdminStatusType,
    default: AdminStatusType.ACTIVE,
  })
  status: AdminStatusType;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization, (organization) => organization.admins)
  organization: Organization;

  @Field(() => [Version], { nullable: true })
  @OneToMany(() => Version, (version) => version.assigned_admin)
  assigned_course_versions_for_review: Version[];
}
