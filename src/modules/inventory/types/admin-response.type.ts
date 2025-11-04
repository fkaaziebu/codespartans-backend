import { Field, ObjectType } from '@nestjs/graphql';
import { AdminTypeClass } from 'src/database/types';

@ObjectType('AdminResponse')
export class AdminResponse extends AdminTypeClass {
  @Field()
  total_course_versions: number;

  @Field()
  total_approved_course_versions: number;
}
