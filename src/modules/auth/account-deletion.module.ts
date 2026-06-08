import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
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
    BullModule.registerQueue(
      { name: 'account-deletion-queue' },
      { name: 'email-queue' },
    ),
    TypeOrmModule.forFeature([Student, Parent, Child, Cart, Checkout, Test]),
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
