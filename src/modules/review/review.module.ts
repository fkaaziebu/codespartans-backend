import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from 'src/modules/auth/entities/admin.entity';
import { Instructor } from 'src/modules/auth/entities/instructor.entity';
import { Course } from 'src/modules/inventory/entities/course.entity';
import { Issue } from './entities/issue.entity';
import { Question } from './entities/question.entity';
import { Review } from './entities/review.entity';
import { ReviewRequest } from './entities/review_request.entity';
import { TestSuite } from './entities/test_suite.entity';
import { Version } from './entities/version.entity';
import { JwtStrategy } from 'src/helpers/strategies';
import { AdminResolver, InstructorResolver } from './resolvers';
import {
  AdminService,
  InstructorService,
  MeilisearchConsumer,
  MeilisearchProducer,
  MeilisearchService,
} from './services';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'meilisearch-queue',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: 86400,
        },
      }),
    }),
    TypeOrmModule.forFeature([
      Admin,
      Course,
      Instructor,
      Issue,
      Question,
      Review,
      ReviewRequest,
      TestSuite,
      Version,
    ]),
  ],
  controllers: [],
  providers: [
    AdminService,
    InstructorService,
    JwtStrategy,
    AdminResolver,
    InstructorResolver,
    MeilisearchConsumer,
    MeilisearchProducer,
    MeilisearchService,
  ],
  exports: [TypeOrmModule],
})
export class ReviewModule {}
