import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from 'src/modules/auth/entities/student.entity';
import { Organization } from 'src/modules/auth/entities/organization.entity';
import { Instructor } from 'src/modules/auth/entities/instructor.entity';
import { Cart } from './entities/cart.entity';
import { Category } from './entities/category.entity';
import { Checkout } from './entities/checkout.entity';
import { Coupon } from './entities/coupon.entity';
import { Course } from './entities/course.entity';
import { Test } from 'src/modules/simulation/entities/test.entity';
import { JwtStrategy } from 'src/helpers/strategies';
import {
  InstructorResolver,
  OrganizationResolver,
  StudentResolver,
} from './resolvers';
import {
  InstructorService,
  OrganizationService,
  StudentService,
} from './services';

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
      Cart,
      Category,
      Checkout,
      Coupon,
      Course,
      Instructor,
      Organization,
      Student,
      Test,
    ]),
  ],
  controllers: [],
  providers: [
    InstructorService,
    StudentService,
    OrganizationService,
    JwtStrategy,
    InstructorResolver,
    StudentResolver,
    OrganizationResolver,
  ],
  exports: [TypeOrmModule],
})
export class InventoryModule {}
