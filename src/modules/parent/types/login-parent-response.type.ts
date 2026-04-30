import { Field, ObjectType } from '@nestjs/graphql';
import { Parent } from '../entities/parent.entity';

@ObjectType()
export class LoginParentResponse extends Parent {
  @Field()
  token: string;

  @Field()
  refresh_token: string;
}
