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
exports.StudentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cart_entity_1 = require("../../inventory/entities/cart.entity");
const organization_entity_1 = require("../entities/organization.entity");
const student_entity_1 = require("../entities/student.entity");
const helpers_1 = require("../../../helpers");
const uuid_1 = require("uuid");
const email_producer_1 = require("./email.producer");
const signup_producer_1 = require("./signup.producer");
let StudentService = class StudentService {
    constructor(studentRepository, jwtService, configService, emailProducer, signupProducer) {
        this.studentRepository = studentRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.emailProducer = emailProducer;
        this.signupProducer = signupProducer;
    }
    async listOrganizationsPaginated({ searchTerm, pagination, }) {
        const organizations = await this.listOrganizations({
            searchTerm,
        });
        return helpers_1.PaginateHelper.paginate(organizations, pagination, (organization) => organization.id.toString());
    }
    async listOrganizations({ searchTerm }) {
        return this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const organizations = await transactionalEntityManager.find(organization_entity_1.Organization, {
                where: {
                    name: searchTerm ? (0, typeorm_2.ILike)(`%${searchTerm.trim()}%`) : undefined,
                },
            });
            return organizations;
        });
    }
    async studentProfile({ email }) {
        return this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: {
                    email,
                },
                relations: ['organizations', 'subscribed_categories'],
            });
            if (!student) {
                throw new common_1.NotFoundException('Student does not exist');
            }
            return student;
        });
    }
    async registerStudent({ name, email, password, }) {
        return await this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const existingStudent = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: { email },
                relations: ['organizations'],
            });
            if (existingStudent) {
                throw new Error('Student with this email already exists');
            }
            const organization = await transactionalEntityManager.findOne(organization_entity_1.Organization, {
                where: { email: this.configService.get('GENPOP_EMAIL') },
            });
            if (!organization) {
                throw new Error('Organization not found');
            }
            const cart = new cart_entity_1.Cart();
            await transactionalEntityManager.save(cart_entity_1.Cart, cart);
            const validationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const student = new student_entity_1.Student();
            student.name = name;
            student.email = email;
            student.password = await helpers_1.HashHelper.encrypt(password);
            student.cart = cart;
            student.organizations = [organization];
            student.is_account_validated = false;
            student.validation_code = validationCode;
            await transactionalEntityManager.save(student_entity_1.Student, student);
            await this.emailProducer.sendAccountValidationEmail({
                email,
                name,
                validationCode,
            });
            return { message: 'Student registered successfully' };
        });
    }
    async loginStudent({ email, password, }) {
        return await this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: { email },
                relations: ['organizations'],
            });
            if (!student) {
                throw new common_1.BadRequestException('Email or password is incorrect');
            }
            const isPasswordValid = await helpers_1.HashHelper.compare(password, student.password);
            if (!isPasswordValid) {
                throw new common_1.BadRequestException('Email or password is incorrect');
            }
            if (!student.is_account_validated) {
                throw new common_1.BadRequestException('Account not verified. Please check your email for the verification code.');
            }
            const payload = {
                id: student.id,
                name: student.name,
                email: student.email,
                role: 'STUDENT',
            };
            const access_token = this.jwtService.sign(payload);
            const refresh_token = this.jwtService.sign({ ...payload, type: 'refresh' }, { expiresIn: '30d' });
            return {
                ...student,
                token: access_token,
                refresh_token,
            };
        });
    }
    async completeStudentAccountValidation({ email, validation_code, }) {
        return this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: { email },
            });
            if (!student) {
                throw new common_1.NotFoundException('Student not found');
            }
            if (student.is_account_validated) {
                return { message: 'Account already verified' };
            }
            if (student.validation_code !== validation_code) {
                throw new common_1.BadRequestException('Invalid verification code');
            }
            student.is_account_validated = true;
            student.validation_code = null;
            await transactionalEntityManager.save(student_entity_1.Student, student);
            await this.signupProducer.enqueueFreeTrial({ email, role: 'STUDENT' });
            return { message: 'Account verified successfully' };
        });
    }
    async resendAccountValidationCode({ email, }) {
        return this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: { email },
            });
            if (!student) {
                throw new common_1.NotFoundException('Student not found');
            }
            if (student.is_account_validated) {
                throw new common_1.BadRequestException('Account is already verified');
            }
            const validationCode = Math.floor(100000 + Math.random() * 900000).toString();
            student.validation_code = validationCode;
            await transactionalEntityManager.save(student_entity_1.Student, student);
            await this.emailProducer.sendAccountValidationEmail({
                email,
                name: student.name,
                validationCode,
            });
            return { message: 'Verification code resent successfully' };
        });
    }
    async refreshStudentToken({ refresh_token, }) {
        let payload;
        try {
            payload = this.jwtService.verify(refresh_token);
        }
        catch {
            throw new common_1.BadRequestException('Invalid or expired refresh token');
        }
        if (payload.type !== 'refresh') {
            throw new common_1.BadRequestException('Invalid token type');
        }
        const { type: _type, iat: _iat, exp: _exp, ...tokenPayload } = payload;
        const access_token = this.jwtService.sign(tokenPayload);
        return { access_token };
    }
    async requestStudentPasswordReset({ email }) {
        return this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: { email },
            });
            if (!student) {
                return { message: 'Password reset link sent to your email' };
            }
            const resetCode = (0, uuid_1.v4)();
            student.reset_token = resetCode;
            await transactionalEntityManager.save(student);
            await this.emailProducer.sendPasswordResetEmail({
                email,
                name: student.name,
                resetCode,
            });
            return {
                message: 'Password reset link sent to your email',
            };
        });
    }
    async resetStudentPassword({ email, password, token, }) {
        return this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: { email },
            });
            if (!student || student.reset_token !== token) {
                throw new common_1.BadRequestException('Invalid Password reset details');
            }
            student.reset_token = '';
            student.password = await helpers_1.HashHelper.encrypt(password);
            await transactionalEntityManager.save(student);
            return {
                message: 'Password reset is successful',
            };
        });
    }
    async validateGoogleUser(googleUser) {
        const user = await this.studentRepository.findOne({
            where: { email: googleUser.email },
            relations: ['organizations'],
        });
        return user;
    }
    async createGoogleUser({ firstName, lastName, email }) {
        return await this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const name = firstName + ' ' + lastName;
            const existingUser = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: { email },
            });
            if (existingUser) {
                throw new common_1.BadRequestException('Email already exist');
            }
            const organization = await transactionalEntityManager.findOne(organization_entity_1.Organization, {
                where: { email: this.configService.get('GENPOP_EMAIL') },
            });
            if (!organization) {
                throw new Error('Organization not found');
            }
            const cart = new cart_entity_1.Cart();
            await transactionalEntityManager.save(cart);
            const validationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const student = new student_entity_1.Student();
            student.name = name;
            student.email = email;
            student.password = await helpers_1.HashHelper.encrypt('password');
            student.cart = cart;
            student.organizations = [organization];
            student.is_account_validated = false;
            student.validation_code = validationCode;
            await transactionalEntityManager.save(student);
            const savedUser = await transactionalEntityManager.save(student);
            await this.emailProducer.sendAccountValidationEmail({
                email,
                name,
                validationCode,
            });
            const payload = {
                id: savedUser.id,
                organizationId: organization.id,
                name: savedUser.name,
                email: savedUser.email,
                role: 'STUDENT',
            };
            return payload;
        });
    }
};
exports.StudentService = StudentService;
exports.StudentService = StudentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_producer_1.EmailProducer,
        signup_producer_1.SignupProducer])
], StudentService);
//# sourceMappingURL=student.service.js.map