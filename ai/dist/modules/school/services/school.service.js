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
exports.SchoolService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const helpers_1 = require("../../../helpers");
const organization_entity_1 = require("../../auth/entities/organization.entity");
const student_entity_1 = require("../../auth/entities/student.entity");
const cart_entity_1 = require("../../inventory/entities/cart.entity");
const category_entity_1 = require("../../inventory/entities/category.entity");
const typeorm_2 = require("typeorm");
const school_student_entity_1 = require("../entities/school-student.entity");
let SchoolService = class SchoolService {
    constructor(schoolStudentRepo, studentRepo, orgRepo, categoryRepo, cartRepo, jwtService, configService) {
        this.schoolStudentRepo = schoolStudentRepo;
        this.studentRepo = studentRepo;
        this.orgRepo = orgRepo;
        this.categoryRepo = categoryRepo;
        this.cartRepo = cartRepo;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async addSchoolStudent(orgEmail, input) {
        return this.orgRepo.manager.transaction(async (em) => {
            const org = await em.findOne(organization_entity_1.Organization, {
                where: { email: orgEmail },
            });
            if (!org)
                throw new common_1.NotFoundException('Organization not found');
            const category = await em.findOne(category_entity_1.Category, {
                where: { id: input.target_exam },
                relations: ['courses'],
            });
            if (!category) {
                throw new common_1.NotFoundException(`Exam category with id ${input.target_exam} not found`);
            }
            const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
            const username = await this.generateUniqueUsername(input.full_name, em);
            const cart = em.create(cart_entity_1.Cart, {});
            await em.save(cart_entity_1.Cart, cart);
            const student = em.create(student_entity_1.Student, {
                name: input.full_name,
                email: `${username}@student.local`,
                password: await helpers_1.HashHelper.encrypt(rawPin),
                is_account_validated: true,
                is_setup_completed: true,
                cart,
                organizations: [org],
                subscribed_categories: [category],
                subscribed_courses: category.courses ?? [],
            });
            await em.save(student_entity_1.Student, student);
            const schoolStudent = em.create(school_student_entity_1.SchoolStudent, {
                full_name: input.full_name,
                class_level: input.class_level,
                target_exam: input.target_exam,
                username,
                pin: await helpers_1.HashHelper.encrypt(rawPin),
                organization: org,
                student,
            });
            await em.save(school_student_entity_1.SchoolStudent, schoolStudent);
            return { message: 'Student enrolled successfully', pin: rawPin };
        });
    }
    async bulkEnrollStudents(orgEmail, students) {
        return this.orgRepo.manager.transaction(async (em) => {
            const org = await em.findOne(organization_entity_1.Organization, {
                where: { email: orgEmail },
            });
            if (!org)
                throw new common_1.NotFoundException('Organization not found');
            const results = [];
            for (const input of students) {
                const category = await em.findOne(category_entity_1.Category, {
                    where: { id: input.target_exam },
                    relations: ['courses'],
                });
                if (!category) {
                    throw new common_1.NotFoundException(`Exam category with id ${input.target_exam} not found`);
                }
                const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
                const username = await this.generateUniqueUsername(input.full_name, em);
                const cart = em.create(cart_entity_1.Cart, {});
                await em.save(cart_entity_1.Cart, cart);
                const student = em.create(student_entity_1.Student, {
                    name: input.full_name,
                    email: `${username}@student.local`,
                    password: await helpers_1.HashHelper.encrypt(rawPin),
                    is_account_validated: true,
                    is_setup_completed: true,
                    cart,
                    organizations: [org],
                    subscribed_categories: [category],
                    subscribed_courses: category.courses ?? [],
                });
                await em.save(student_entity_1.Student, student);
                const schoolStudent = em.create(school_student_entity_1.SchoolStudent, {
                    full_name: input.full_name,
                    class_level: input.class_level,
                    target_exam: input.target_exam,
                    username,
                    pin: await helpers_1.HashHelper.encrypt(rawPin),
                    organization: org,
                    student,
                });
                await em.save(school_student_entity_1.SchoolStudent, schoolStudent);
                results.push({ full_name: input.full_name, username, pin: rawPin });
            }
            return results;
        });
    }
    async resetStudentPin(orgEmail, studentId) {
        return this.orgRepo.manager.transaction(async (em) => {
            const schoolStudent = await em.findOne(school_student_entity_1.SchoolStudent, {
                where: { id: studentId, organization: { email: orgEmail } },
                relations: ['student'],
            });
            if (!schoolStudent) {
                throw new common_1.NotFoundException('Student not found');
            }
            const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
            const hashed = await helpers_1.HashHelper.encrypt(rawPin);
            schoolStudent.pin = hashed;
            await em.save(school_student_entity_1.SchoolStudent, schoolStudent);
            if (schoolStudent.student) {
                schoolStudent.student.password = hashed;
                await em.save(student_entity_1.Student, schoolStudent.student);
            }
            return { message: 'PIN reset successfully', pin: rawPin };
        });
    }
    async shareStudentLogin(orgEmail, studentId) {
        return this.orgRepo.manager.transaction(async (em) => {
            const schoolStudent = await em.findOne(school_student_entity_1.SchoolStudent, {
                where: { id: studentId, organization: { email: orgEmail } },
                relations: ['student'],
            });
            if (!schoolStudent) {
                throw new common_1.NotFoundException('Student not found');
            }
            const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
            const hashed = await helpers_1.HashHelper.encrypt(rawPin);
            schoolStudent.pin = hashed;
            await em.save(school_student_entity_1.SchoolStudent, schoolStudent);
            if (schoolStudent.student) {
                schoolStudent.student.password = hashed;
                await em.save(student_entity_1.Student, schoolStudent.student);
            }
            const studentUrl = this.configService.get('STUDENT_URL', 'http://localhost:3000');
            const message = `Here are ${schoolStudent.full_name}'s login details — ` +
                `Username: ${schoolStudent.username} | PIN: ${rawPin} | ` +
                `Login at: ${studentUrl}/student-login`;
            return { message };
        });
    }
    async listSchoolStudents(orgEmail, searchTerm, pagination) {
        const org = await this.orgRepo.findOne({ where: { email: orgEmail } });
        if (!org)
            throw new common_1.NotFoundException('Organization not found');
        const students = await this.schoolStudentRepo.find({
            where: {
                organization: { id: org.id },
                ...(searchTerm
                    ? { full_name: (0, typeorm_2.ILike)(`%${searchTerm.trim()}%`) }
                    : {}),
            },
            relations: ['student'],
            order: { full_name: 'ASC' },
        });
        return helpers_1.PaginateHelper.paginate(students, pagination, (s) => s.id);
    }
    async removeSchoolStudent(orgEmail, studentId) {
        return this.orgRepo.manager.transaction(async (em) => {
            const schoolStudent = await em.findOne(school_student_entity_1.SchoolStudent, {
                where: { id: studentId, organization: { email: orgEmail } },
                relations: ['student'],
            });
            if (!schoolStudent) {
                throw new common_1.NotFoundException('Student not found');
            }
            if (schoolStudent.student) {
                const student = await em.findOne(student_entity_1.Student, {
                    where: { id: schoolStudent.student.id },
                    relations: ['organizations'],
                });
                if (student) {
                    student.organizations = student.organizations.filter((o) => o.email !== orgEmail);
                    await em.save(student_entity_1.Student, student);
                }
            }
            await em.remove(school_student_entity_1.SchoolStudent, schoolStudent);
            return { message: 'Student removed from school successfully' };
        });
    }
    async verifyStudentUsername(username) {
        const schoolStudent = await this.schoolStudentRepo.findOne({
            where: { username },
        });
        if (!schoolStudent) {
            throw new common_1.NotFoundException('Username not found');
        }
        const payload = {
            id: schoolStudent.id,
            username: schoolStudent.username,
            role: 'SCHOOL_STUDENT',
            type: 'temp',
        };
        const temp_token = this.jwtService.sign(payload, { expiresIn: '5m' });
        return { temp_token };
    }
    async loginSchoolStudent(temp_token, pin) {
        let payload;
        try {
            payload = this.jwtService.verify(temp_token);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
        if (payload.type !== 'temp' || payload.role !== 'SCHOOL_STUDENT') {
            throw new common_1.UnauthorizedException('Invalid token type');
        }
        const schoolStudent = await this.schoolStudentRepo.findOne({
            where: { id: payload.id },
            relations: ['student', 'student.organizations'],
        });
        if (!schoolStudent) {
            throw new common_1.NotFoundException('Student not found');
        }
        const isPinValid = await helpers_1.HashHelper.compare(pin, schoolStudent.pin);
        if (!isPinValid) {
            throw new common_1.BadRequestException('Invalid PIN');
        }
        const tokenPayload = {
            id: schoolStudent.student.id,
            name: schoolStudent.student.name,
            email: schoolStudent.student.email,
            role: 'STUDENT',
        };
        const token = this.jwtService.sign(tokenPayload);
        const refresh_token = this.jwtService.sign({ ...tokenPayload, type: 'refresh' }, { expiresIn: '30d' });
        return { ...schoolStudent, token, refresh_token };
    }
    async generateUniqueUsername(full_name, entityManager) {
        const parts = full_name.trim().toLowerCase().split(/\s+/);
        const base = parts.length >= 2 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0];
        let username;
        let exists = true;
        while (exists) {
            const suffix = Math.floor(10 + Math.random() * 90).toString();
            username = `${base}${suffix}`;
            const found = await entityManager.findOne(school_student_entity_1.SchoolStudent, {
                where: { username },
            });
            exists = !!found;
        }
        return username;
    }
};
exports.SchoolService = SchoolService;
exports.SchoolService = SchoolService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(school_student_entity_1.SchoolStudent)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(3, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(4, (0, typeorm_1.InjectRepository)(cart_entity_1.Cart)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService])
], SchoolService);
//# sourceMappingURL=school.service.js.map