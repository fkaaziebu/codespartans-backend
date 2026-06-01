import { ObjectType } from '@nestjs/graphql';
import { Paginated } from 'src/helpers/types';
import { TestSuite } from 'src/modules/review/entities/test_suite.entity';

@ObjectType('TestSuiteConnection')
export class TestSuiteConnection extends Paginated(TestSuite) {}
