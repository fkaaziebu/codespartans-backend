import { ObjectType } from '@nestjs/graphql';
import { Question as QuestionTypeClass } from 'src/database/entities/question.entity';
import { Paginated } from '../../../helpers/types';

@ObjectType('QuestionConnection')
export class QuestionConnection extends Paginated(QuestionTypeClass) {}
