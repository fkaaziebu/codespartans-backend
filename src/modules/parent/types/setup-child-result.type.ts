import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('SetupChildResult')
export class SetupChildResult {
  @Field()
  full_name: string;

  @Field()
  username: string;

  @Field()
  pin: string;
}
