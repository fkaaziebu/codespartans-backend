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
exports.InstructorService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const instructor_entity_1 = require("../entities/instructor.entity");
const helpers_1 = require("../../../helpers");
let InstructorService = class InstructorService {
    constructor(instructorRepository, jwtService) {
        this.instructorRepository = instructorRepository;
        this.jwtService = jwtService;
    }
    async loginInstructor({ email, password, }) {
        return await this.instructorRepository.manager.transaction(async (transactionalEntityManager) => {
            const instructor = await transactionalEntityManager.findOne(instructor_entity_1.Instructor, {
                where: { email },
                relations: ['organizations'],
            });
            if (!instructor) {
                throw new common_1.BadRequestException('Email or password is incorrect');
            }
            const isPasswordValid = await helpers_1.HashHelper.compare(password, instructor.password);
            if (!isPasswordValid) {
                throw new common_1.BadRequestException('Email or password is incorrect');
            }
            const payload = {
                id: instructor.id,
                name: instructor.name,
                email: instructor.email,
                role: 'INSTRUCTOR',
            };
            const access_token = this.jwtService.sign(payload);
            return {
                ...instructor,
                token: access_token,
            };
        });
    }
};
exports.InstructorService = InstructorService;
exports.InstructorService = InstructorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(instructor_entity_1.Instructor)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], InstructorService);
//# sourceMappingURL=instructor.service.js.map