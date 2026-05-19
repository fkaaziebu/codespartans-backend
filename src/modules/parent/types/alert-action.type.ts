import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('AlertAction')
export class AlertAction {
  @Field()
  label: string;

  @Field()
  variant: string;

  @Field()
  href: string;
}
