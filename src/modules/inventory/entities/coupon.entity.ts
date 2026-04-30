import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Course } from './course.entity';
import { Organization } from '../../auth/entities/organization.entity';

@ObjectType('Coupon')
@Entity('coupons')
export class Coupon {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(
    () => Organization,
    (organization) => organization.organizational_coupons,
  )
  organization: Organization;

  @Field(() => [Course], { nullable: true })
  @ManyToMany(() => Course)
  courses: Course[];
}
