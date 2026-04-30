import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { Instructor } from './entities/instructor.entity';
import { Organization } from './entities/organization.entity';
import { Student } from './entities/student.entity';
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
    TypeOrmModule.forFeature([Admin, Instructor, Organization, Student]),
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
  exports: [TypeOrmModule],
})
export class AuthModule {}
