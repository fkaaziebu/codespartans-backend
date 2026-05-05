import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BookDemoResponse {
  @Field()
  message: string;
}
