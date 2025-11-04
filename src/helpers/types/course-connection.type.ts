import { ObjectType } from '@nestjs/graphql';
import { CourseResponse } from './course-response.type';
import { Paginated } from './pagination.type';

@ObjectType('CourseConnection')
export class CourseConnection extends Paginated(CourseResponse) {}
