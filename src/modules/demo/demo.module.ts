import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from '../inventory/entities/cart.entity';
import { Organization } from '../auth/entities/organization.entity';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionGuard } from 'src/helpers/guards/subscription.guard';
import { OrgSubscription } from './entities/organization-subscription.entity';
import { ParentDemoRequest } from './entities/parent-demo-request.entity';
import { SchoolDemo } from './entities/school-demo.entity';
import { StudentDemoRequest } from './entities/student-demo-request.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { PaymentController } from './controllers/payment.controller';
import { DemoResolver } from './resolvers/demo.resolver';
import { DemoService } from './services/demo.service';
import { PaymentService } from './services/payment.service';
import { Student } from '../auth/entities/student.entity';
import { Parent } from '../parent/entities/parent.entity';
import { EmailConsumer } from '../auth/services/email.consumer';
import { EmailProducer } from '../auth/services/email.producer';
import { EmailService } from '../auth/services/email.service';
import { BullModule } from '@nestjs/bullmq';

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
        signOptions: { expiresIn: 86400 },
      }),
    }),
    TypeOrmModule.forFeature([
      SchoolDemo,
      ParentDemoRequest,
      StudentDemoRequest,
      SubscriptionPlan,
      OrgSubscription,
      Cart,
      Organization,
      Student,
      Parent,
    ]),
    AuthModule,
  ],
  controllers: [PaymentController],
  providers: [
    DemoResolver,
    DemoService,
    PaymentService,
    SubscriptionGuard,
    EmailProducer,
    EmailConsumer,
    EmailService,
  ],
  exports: [TypeOrmModule, SubscriptionGuard],
})
export class DemoModule {}
