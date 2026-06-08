"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const image_entity_1 = require("./entities/image.entity");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
let MediaService = class MediaService {
    constructor(imageRepository) {
        this.imageRepository = imageRepository;
    }
    async uploadImage({ file }) {
        try {
            const image = new image_entity_1.Image();
            image.path = `${(0, uuid_1.v4)()}.${file.originalname.split('.').pop()}`;
            image.original_name = file.originalname;
            image.buffer = file.buffer;
            image.mime_type = file.mimetype;
            const savedImage = await this.imageRepository.save(image);
            return {
                message: 'Upload successful',
                path: savedImage.path,
            };
        }
        catch (err) {
            throw new common_1.BadRequestException(err);
        }
    }
    async fetchImage({ id }) {
        try {
            const image = await this.imageRepository.findOne({
                where: { path: id },
            });
            return image;
        }
        catch (err) {
            throw new common_1.BadRequestException(err);
        }
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(image_entity_1.Image)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MediaService);
//# sourceMappingURL=media.service.js.map