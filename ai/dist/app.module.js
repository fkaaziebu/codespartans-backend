"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const apollo_1 = require("@nestjs/apollo");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const graphql_1 = require("@nestjs/graphql");
const config_schema_1 = require("./config.schema");
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./modules/auth/auth.module");
const demo_module_1 = require("./modules/demo/demo.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const media_module_1 = require("./modules/media/media.module");
const parent_module_1 = require("./modules/parent/parent.module");
const review_module_1 = require("./modules/review/review.module");
const school_module_1 = require("./modules/school/school.module");
const simulation_module_1 = require("./modules/simulation/simulation.module");
const setup_db_2_service_1 = require("./setup-db-2.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                envFilePath: [
                    process.env.STAGE === 'development'
                        ? `.env.${process.env.STAGE}.local`
                        : '.env',
                ],
                validationSchema: config_schema_1.configValidationSchema,
            }),
            graphql_1.GraphQLModule.forRoot({
                autoSchemaFile: true,
                introspection: true,
                playground: true,
                driver: apollo_1.ApolloDriver,
                resolvers: {},
            }),
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            demo_module_1.DemoModule,
            review_module_1.ReviewModule,
            inventory_module_1.InventoryModule,
            media_module_1.MediaModule,
            simulation_module_1.SimulationModule,
            parent_module_1.ParentModule,
            school_module_1.SchoolModule,
        ],
        controllers: [],
        providers: [setup_db_2_service_1.SetupDbService],
        exports: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map