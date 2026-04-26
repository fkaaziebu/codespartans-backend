import { Field, ObjectType } from '@nestjs/graphql';
import { Admin as AdminTypeClass } from 'src/database/entities/admin.entity';

@ObjectType()
export class AdminLoginResponse extends AdminTypeClass {
  @Field()
  token: string;
}
