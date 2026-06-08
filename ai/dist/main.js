"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const pg_1 = require("pg");
const app_module_1 = require("./app.module");
async function createDatabase(dbName) {
    const client = new pg_1.Client({
        user: process.env.DB_USERNAME,
        host: process.env.DB_HOST,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });
    try {
        await client.connect();
        await client.query(`CREATE DATABASE "${dbName}"`);
        console.log(`Database ${dbName} created successfully`);
    }
    catch (error) {
        if (error.code === '42P04') {
            console.log(`Database ${dbName} already exists`);
        }
        else {
            console.error(`Error creating database ${dbName}:`, error);
        }
    }
    finally {
        await client.end();
    }
}
async function bootstrap() {
    await createDatabase(process.env.DB_NAME);
    await createDatabase(process.env.DB_NAME_TEST);
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { rawBody: true });
    app.useGlobalPipes(new common_1.ValidationPipe());
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT') || 4000;
    app.enableCors({
        origin: configService.get('CORS_ORIGIN') || '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    await app.listen(port);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
//# sourceMappingURL=main.js.map