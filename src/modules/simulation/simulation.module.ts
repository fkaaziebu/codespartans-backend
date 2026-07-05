import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemoModule } from 'src/modules/demo/demo.module';
import { Student } from 'src/modules/auth/entities/student.entity';
import { Child } from 'src/modules/parent/entities/child.entity';
import { JwtStrategy } from 'src/helpers/strategies';
import { Recommendation } from './entities/recommendation.entity';
import { SemanticCache } from './entities/semantic_cache.entity';
import { SubmittedAnswer } from './entities/sumitted_answer.entity';
import { Test } from './entities/test.entity';
import { TestAssignment } from './entities/test_assignment.entity';
import { TimeEvent } from './entities/time_event.entity';
import { StudentResolver } from './resolvers';
import { StudentService } from './services';
import { EndTestConsumer } from './services/end-test.consumer';
import { EndTestProducer } from './services/end-test.producer';
import { InsightService } from './services/insight.service';
import { MarkAnswerConsumer } from './services/mark-answer.consumer';
import { MarkAnswerProducer } from './services/mark-answer.producer';
import { MarkAnswerService } from './services/mark-answer.service';
import { SemanticCacheService } from './services/semantic-cache.service';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue(
      {
        name: 'mark-answer-queue',
      },
      {
        name: 'end-test-queue',
      },
    ),
    DemoModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: 900,
        },
      }),
    }),
    TypeOrmModule.forFeature([
      Child,
      Recommendation,
      SemanticCache,
      Student,
      SubmittedAnswer,
      Test,
      TestAssignment,
      TimeEvent,
    ]),
  ],
  providers: [
    StudentService,
    InsightService,
    JwtStrategy,
    StudentResolver,
    MarkAnswerProducer,
    SemanticCacheService,
    MarkAnswerService,
    MarkAnswerConsumer,
    EndTestProducer,
    EndTestConsumer,
  ],
  exports: [TypeOrmModule],
})
export class SimulationModule {}
