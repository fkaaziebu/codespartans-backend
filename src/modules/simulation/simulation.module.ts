import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from 'src/database/entities';
import { JwtStrategy } from 'src/helpers/strategies';
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
    TypeOrmModule.forFeature(entities),
  ],
  controllers: [StudentController],
  providers: [
    StudentService,
    TestTimerService,
    JwtStrategy,
    StudentResolver,
    StudentGateway,
  ],
})
export class SimulationModule {}
