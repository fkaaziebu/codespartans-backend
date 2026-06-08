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
exports.MediaController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const guards_1 = require("./guards");
const media_service_1 = require("./media.service");
let MediaController = class MediaController {
    constructor(mediaService) {
        this.mediaService = mediaService;
    }
    uploadImage(file) {
        return this.mediaService.uploadImage({ file });
    }
    async fetchImage(imageId, res) {
        const image = await this.mediaService.fetchImage({ id: imageId });
        res.setHeader('Content-Type', image.mime_type);
        res.send(image.buffer);
    }
};
exports.MediaController = MediaController;
__decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, common_1.Post)('/images/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MediaController.prototype, "uploadImage", null);
__decorate([
    (0, common_1.Get)('/images/:imageId'),
    __param(0, (0, common_1.Param)('imageId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "fetchImage", null);
exports.MediaController = MediaController = __decorate([
    (0, common_1.Controller)('v1'),
    __metadata("design:paramtypes", [media_service_1.MediaService])
], MediaController);
//# sourceMappingURL=media.controller.js.map