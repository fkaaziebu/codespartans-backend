import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { JwtStrategy } from 'src/helpers/strategies';
import { Student } from 'src/modules/auth/entities/student.entity';
import { Organization } from 'src/modules/auth/entities/organization.entity';
import { Cart } from 'src/modules/inventory/entities/cart.entity';
import { Category } from 'src/modules/inventory/entities/category.entity';
import { Test } from 'src/modules/simulation/entities/test.entity';
import { EmailConsumer } from '../auth/services/email.consumer';
import { EmailProducer } from '../auth/services/email.producer';
import { EmailService } from '../auth/services/email.service';
import { Child } from './entities/child.entity';
import { Parent } from './entities/parent.entity';
import { ParentResolver } from './resolvers/parent.resolver';
import { ParentService } from './services/parent.service';

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
    TypeOrmModule.forFeature([Parent, Child, Student, Organization, Cart, Category, Test]),
  ],
  providers: [ParentService, ParentResolver, JwtStrategy, EmailProducer, EmailConsumer, EmailService],
  exports: [TypeOrmModule],
})
export class ParentModule {}
