import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from 'src/database/entities';
import { JwtStrategy } from '../../helpers/strategies';
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
    TypeOrmModule.forFeature(entities),
  ],
  controllers: [],
  providers: [
    AdminService,
    InstructorService,
    StudentService,
    OrganizationService,
    JwtStrategy,
    AdminResolver,
    InstructorResolver,
    StudentResolver,
    OrganizationResolver,
  ],
})
export class AuthModule {}
