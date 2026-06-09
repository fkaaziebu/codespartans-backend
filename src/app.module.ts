import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerModule, minutes } from '@nestjs/throttler';
import { configValidationSchema } from './config.schema';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { DemoModule } from './modules/demo/demo.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MediaModule } from './modules/media/media.module';
import { ParentModule } from './modules/parent/parent.module';
import { ReviewModule } from './modules/review/review.module';
import { SchoolModule } from './modules/school/school.module';
import { SimulationModule } from './modules/simulation/simulation.module';
import { SetupDbService } from './setup-db-2.service';
import { LoggingRedactionPlugin } from './plugins';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [
        process.env.STAGE === 'development'
          ? `.env.${process.env.STAGE}.local`
          : '.env',
      ],
      validationSchema: configValidationSchema,
      // validatePredefined: false,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: true,
      introspection: true,
      playground: true,
      driver: ApolloDriver,
      resolvers: {},
      context: ({ req, res }) => ({ req, res }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: minutes(1), limit: 10 }],
    }),
    DatabaseModule,
    AuthModule,
    DemoModule,
    ReviewModule,
    InventoryModule,
    MediaModule,
    SimulationModule,
    ParentModule,
    SchoolModule,
  ],
  controllers: [],
  providers: [SetupDbService, LoggingRedactionPlugin],
  exports: [],
})
export class AppModule {}
