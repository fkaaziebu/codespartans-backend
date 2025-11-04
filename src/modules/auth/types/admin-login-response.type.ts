import { Field, ObjectType } from '@nestjs/graphql';
import { AdminTypeClass } from 'src/database/types';

@ObjectType()
export class AdminLoginResponse extends AdminTypeClass {
  @Field()
  token: string;
}
