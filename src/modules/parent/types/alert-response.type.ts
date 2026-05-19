import { Field, ObjectType } from '@nestjs/graphql';
import { AlertAction } from './alert-action.type';

@ObjectType('AlertResponse')
export class AlertResponse {
  @Field()
  id: string;

  @Field()
  alert_type: string;

  @Field()
  icon: string;

  @Field()
  icon_bg: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  time_label: string;

  @Field()
  is_unread: boolean;

  @Field(() => [AlertAction])
  actions: AlertAction[];
}
