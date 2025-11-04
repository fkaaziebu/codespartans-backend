import { Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Course } from './course.entity';
import { Organization } from './organization.entity';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => Organization,
    (organization) => organization.organizational_coupons,
  )
  organization: Organization;

  @ManyToMany(() => Course)
  courses: Course[];
}
