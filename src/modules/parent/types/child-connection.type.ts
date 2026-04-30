import { ObjectType } from '@nestjs/graphql';
import { Paginated } from 'src/helpers/types/pagination.type';
import { Child } from '../entities/child.entity';

@ObjectType()
export class ChildConnection extends Paginated(Child) {}
