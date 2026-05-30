import { Field, InputType } from '@nestjs/graphql';
import { Gender } from '../entities/parent.entity';

@InputType()
export class RegisterParentInput {
  @Field()
  first_name: string;

  @Field()
  last_name: string;

  @Field()
  email: string;

  @Field()
  whatsapp_number: string;

  @Field()
  password: string;

  @Field(() => Gender, { nullable: true })
  gender?: Gender;
}
