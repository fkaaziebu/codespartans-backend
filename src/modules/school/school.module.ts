import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { JwtStrategy } from 'src/helpers/strategies';
import { Organization } from 'src/modules/auth/entities/organization.entity';
import { Student } from 'src/modules/auth/entities/student.entity';
import { EmailConsumer } from 'src/modules/auth/services/email.consumer';
import { EmailProducer } from 'src/modules/auth/services/email.producer';
import { EmailService } from 'src/modules/auth/services/email.service';
import { Cart } from 'src/modules/inventory/entities/cart.entity';
import { Category } from 'src/modules/inventory/entities/category.entity';
import { SchoolStudent } from './entities/school-student.entity';
import { SchoolResolver } from './resolvers/school.resolver';
import { SchoolService } from './services/school.service';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({ name: 'email-queue' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: 86400 },
      }),
    }),
    TypeOrmModule.forFeature([
      SchoolStudent,
      Organization,
      Student,
      Cart,
      Category,
    ]),
  ],
  providers: [
    SchoolService,
    SchoolResolver,
    JwtStrategy,
    EmailProducer,
    EmailConsumer,
    EmailService,
  ],
  exports: [TypeOrmModule],
})
export class SchoolModule {}
