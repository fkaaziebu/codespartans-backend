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
import { SubmittedAnswer } from './entities/sumitted_answer.entity';
import { Test } from './entities/test.entity';
import { TestAssignment } from './entities/test_assignment.entity';
import { TimeEvent } from './entities/time_event.entity';
import { StudentController } from './controllers/student.controller';
import { StudentGateway } from './gateways/student.gateway';
import { StudentResolver } from './resolvers';
import { StudentService } from './services';
import { InsightService } from './services/insight.service';
import { MarkAnswerConsumer } from './services/mark-answer.consumer';
import { MarkAnswerProducer } from './services/mark-answer.producer';
import { MarkAnswerService } from './services/mark-answer.service';
import { TestTimerService } from './services/test-timer.service';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'mark-answer-queue',
    }),
    DemoModule,
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
      Child,
      Recommendation,
      Student,
      SubmittedAnswer,
      Test,
      TestAssignment,
      TimeEvent,
    ]),
  ],
  controllers: [StudentController],
  providers: [
    StudentService,
    InsightService,
    TestTimerService,
    JwtStrategy,
    StudentResolver,
    StudentGateway,
    MarkAnswerProducer,
    MarkAnswerService,
    MarkAnswerConsumer,
  ],
  exports: [TypeOrmModule],
})
export class SimulationModule {}
