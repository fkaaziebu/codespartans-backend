import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../../helpers/types';
import { InstructorResponse } from './instructor-response.type';

@ObjectType('InstructorConnection')
export class InstructorConnection extends Paginated(InstructorResponse) {}
