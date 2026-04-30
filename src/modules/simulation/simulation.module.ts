import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from 'src/modules/auth/entities/student.entity';
import { JwtStrategy } from 'src/helpers/strategies';
import { Recommendation } from './entities/recommendation.entity';
import { SubmittedAnswer } from './entities/sumitted_answer.entity';
import { Test } from './entities/test.entity';
import { TimeEvent } from './entities/time_event.entity';
import { StudentController } from './controllers/student.controller';
import { StudentGateway } from './gateways/student.gateway';
import { StudentResolver } from './resolvers';
import { StudentService } from './services';
import { TestTimerService } from './services/test-timer.service';

@Module({
  imports: [
    ConfigModule,
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
      Recommendation,
      Student,
      SubmittedAnswer,
      Test,
      TimeEvent,
    ]),
  ],
  controllers: [StudentController],
  providers: [
    StudentService,
    TestTimerService,
    JwtStrategy,
    StudentResolver,
    StudentGateway,
  ],
  exports: [TypeOrmModule],
})
export class SimulationModule {}
