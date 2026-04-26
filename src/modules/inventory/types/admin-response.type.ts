import { Field, ObjectType } from '@nestjs/graphql';
import { Admin as AdminTypeClass } from 'src/database/entities/admin.entity';

@ObjectType('AdminResponse')
export class AdminResponse extends AdminTypeClass {
  @Field()
  total_course_versions: number;

  @Field()
  total_approved_course_versions: number;
}
