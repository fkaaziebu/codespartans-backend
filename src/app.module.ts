import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { configValidationSchema } from './config.schema';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MediaModule } from './modules/media/media.module';
import { ParentModule } from './modules/parent/parent.module';
import { ReviewModule } from './modules/review/review.module';
import { SimulationModule } from './modules/simulation/simulation.module';
import { SetupDbService } from './setup-db.service';
import { SetupDbResolver } from './setup-db.resolver';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [
        process.env.STAGE === 'development'
          ? `.env.${process.env.STAGE}.local`
          : '.env',
      ],
      validationSchema: configValidationSchema,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: true,
      introspection: true,
      playground: true,
      driver: ApolloDriver,
      resolvers: {},
    }),
    DatabaseModule,
    AuthModule,
    ReviewModule,
    InventoryModule,
    MediaModule,
    SimulationModule,
    ParentModule,
  ],
  controllers: [],
  providers: [SetupDbService, SetupDbResolver],
  exports: [],
})
export class AppModule {}
