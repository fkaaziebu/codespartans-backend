"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashHelper = void 0;
const bcrypt = require("bcrypt");
class HashHelper {
    static async encrypt(str) {
        const salt = await bcrypt.genSalt(this.salt);
        return await bcrypt.hash(str, salt);
    }
    static async compare(plain, encrypted) {
        return await bcrypt.compare(plain, encrypted);
    }
}
exports.HashHelper = HashHelper;
HashHelper.salt = 10;
//# sourceMappingURL=hash.helper.js.map