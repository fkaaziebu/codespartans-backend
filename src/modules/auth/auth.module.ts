import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from 'src/database/entities';
import { GoogleStrategy, JwtStrategy } from '../../helpers/strategies';
import {
  AdminResolver,
  InstructorResolver,
  OrganizationResolver,
  StudentResolver,
} from './resolvers';
import {
  AdminService,
  InstructorService,
  OrganizationService,
  StudentService,
} from './services';
import { BullModule } from '@nestjs/bullmq';
import { EmailProducer } from './services/email.producer';
import { EmailConsumer } from './services/email.consumer';
import { EmailService } from './services/email.service';
import { StudentController } from './controllers/student.controller';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'email-queue',
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
    TypeOrmModule.forFeature(entities),
  ],
  controllers: [StudentController],
  providers: [
    EmailProducer,
    EmailConsumer,
    EmailService,
    AdminService,
    InstructorService,
    StudentService,
    OrganizationService,
    JwtStrategy,
    GoogleStrategy,
    AdminResolver,
    InstructorResolver,
    StudentResolver,
    OrganizationResolver,
  ],
})
export class AuthModule {}
