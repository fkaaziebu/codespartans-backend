"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const dotenv = require("dotenv");
const path_1 = require("path");
const typeorm_1 = require("typeorm");
const stage = process.env.STAGE || 'development';
dotenv.config({ path: (0, path_1.join)(process.cwd(), `.env.${stage}.local`) });
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    entities: [(0, path_1.join)(__dirname, '../**/*.entity{.ts,.js}')],
    migrations: [(0, path_1.join)(__dirname, '../migrations/*{.ts,.js}')],
    synchronize: false,
});
//# sourceMappingURL=data-source.js.map