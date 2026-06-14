import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeletionAuditLog } from './entities/deletion-audit-log.entity';
import { Student } from './entities/student.entity';
import { Parent } from '../parent/entities/parent.entity';
import { Child } from '../parent/entities/child.entity';
import { Cart } from '../inventory/entities/cart.entity';
import { Checkout } from '../inventory/entities/checkout.entity';
import { Test } from '../simulation/entities/test.entity';
import { AccountDeletionService } from './services/account-deletion.service';
import { AccountDeletionProducer } from './services/account-deletion.producer';
import { AccountDeletionConsumer } from './services/account-deletion.consumer';
import { EmailProducer } from './services/email.producer';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue(
      { name: 'account-deletion-queue' },
      { name: 'email-queue' },
    ),
    TypeOrmModule.forFeature([Student, Parent, Child, Cart, Checkout, Test, DeletionAuditLog]),
  ],
  providers: [
    AccountDeletionService,
    AccountDeletionProducer,
    AccountDeletionConsumer,
    EmailProducer,
  ],
  exports: [AccountDeletionService, AccountDeletionProducer],
})
export class AccountDeletionModule {}
