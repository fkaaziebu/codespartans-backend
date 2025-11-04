import { ObjectType } from '@nestjs/graphql';
import { QuestionTypeClass } from 'src/database/types';
import { Paginated } from '../../../helpers/types';

@ObjectType('QuestionConnection')
export class QuestionConnection extends Paginated(QuestionTypeClass) {}
