import { ObjectType } from '@nestjs/graphql';
import { Paginated } from 'src/helpers/types/pagination.type';
import { SchoolStudent } from '../entities/school-student.entity';

@ObjectType()
export class SchoolStudentConnection extends Paginated(SchoolStudent) {}
