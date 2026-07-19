import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('LogEntry')
export class LogEntry {
  @Field()
  time: string;

  @Field()
  level: string;

  @Field({ nullable: true })
  module?: string;

  @Field({ nullable: true })
  requestId?: string;

  @Field({ nullable: true })
  msg?: string;

  @Field()
  sourceFile: string;

  @Field()
  raw: string;

  // Not exposed in the schema — used only as the Relay pagination cursor key.
  cursorId: string;
}
