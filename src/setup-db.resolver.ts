import { Mutation, Resolver } from '@nestjs/graphql';
import { CourseTypeClass } from 'src/database/types';
import { SetupDbService } from './setup-db.service';

@Resolver()
export class SetupDbResolver {
  constructor(private readonly setupDbService: SetupDbService) {}

  @Mutation(() => String)
  setupDatabase() {
    return this.setupDbService.setupDatabase();
  }
}
