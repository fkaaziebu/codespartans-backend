import { Field, ObjectType } from '@nestjs/graphql';
import { Child } from '../entities/child.entity';

@ObjectType()
export class LoginChildResponse extends Child {
  @Field()
  token: string;

  @Field()
  refresh_token: string;
}
