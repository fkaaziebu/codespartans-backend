"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseProviders = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const path_1 = require("path");
const defaultPostgresDBConnection = (configService) => ({
    type: 'postgres',
    autoLoadEntities: true,
    synchronize: false,
    migrationsRun: true,
    migrations: [(0, path_1.join)(__dirname, '../migrations/*{.ts,.js}')],
    url: configService.get('DATABASE_URL'),
    ssl: {
        rejectUnauthorized: false,
    },
});
const defaultRedisDBConnection = async (configService) => ({
    connection: {
        url: configService.get('REDIS_URL'),
    },
});
exports.databaseProviders = [
    typeorm_1.TypeOrmModule.forRootAsync({
        imports: [config_1.ConfigModule],
        inject: [config_1.ConfigService],
        useFactory: defaultPostgresDBConnection,
    }),
    bullmq_1.BullModule.forRootAsync({
        imports: [config_1.ConfigModule],
        inject: [config_1.ConfigService],
        useFactory: defaultRedisDBConnection,
    }),
];
//# sourceMappingURL=database.provider.js.map