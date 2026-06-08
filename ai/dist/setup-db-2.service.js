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
var SetupDbService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupDbService = void 0;
const fs = require("fs");
const path = require("path");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const admin_entity_1 = require("./modules/auth/entities/admin.entity");
const instructor_entity_1 = require("./modules/auth/entities/instructor.entity");
const organization_entity_1 = require("./modules/auth/entities/organization.entity");
const cart_entity_1 = require("./modules/inventory/entities/cart.entity");
const category_entity_1 = require("./modules/inventory/entities/category.entity");
const image_entity_1 = require("./modules/media/entities/image.entity");
const course_entity_1 = require("./modules/inventory/entities/course.entity");
const question_entity_1 = require("./modules/review/entities/question.entity");
const test_suite_entity_1 = require("./modules/review/entities/test_suite.entity");
const version_entity_1 = require("./modules/review/entities/version.entity");
const subscription_plan_entity_1 = require("./modules/demo/entities/subscription-plan.entity");
const helpers_1 = require("./helpers");
const setup_1 = require("./data/setup");
let SetupDbService = SetupDbService_1 = class SetupDbService {
    constructor(organizationRepository, instructorRepository, adminRepository, courseRepository, versionRepository, testSuiteRepository, questionRepository, categoryRepository, cartRepository, imageRepository, planRepository, configService) {
        this.organizationRepository = organizationRepository;
        this.instructorRepository = instructorRepository;
        this.adminRepository = adminRepository;
        this.courseRepository = courseRepository;
        this.versionRepository = versionRepository;
        this.testSuiteRepository = testSuiteRepository;
        this.questionRepository = questionRepository;
        this.categoryRepository = categoryRepository;
        this.cartRepository = cartRepository;
        this.imageRepository = imageRepository;
        this.planRepository = planRepository;
        this.configService = configService;
        this.logger = new common_1.Logger(SetupDbService_1.name);
    }
    async onModuleInit() {
        this.logger.log('Running database setup on startup...');
        await this.setupDatabase();
    }
    async setupDatabase() {
        try {
            const organization = new organization_entity_1.Organization();
            organization.name = 'Kwame Nkrumah Senior High School';
            organization.email = this.configService.get('GENPOP_EMAIL');
            organization.password = await helpers_1.HashHelper.encrypt('password');
            await this.organizationRepository.save(organization);
            const instructor = new instructor_entity_1.Instructor();
            instructor.name = 'Johnson Ameyaw';
            instructor.email = 'johnsonameyaw@gmail.com';
            instructor.password = await helpers_1.HashHelper.encrypt('password');
            instructor.organizations = [organization];
            await this.instructorRepository.save(instructor);
            const admin = new admin_entity_1.Admin();
            admin.name = 'Stephen Grider';
            admin.email = 'stephengrider@gmail.com';
            admin.password = await helpers_1.HashHelper.encrypt('password');
            admin.organization = organization;
            await this.adminRepository.save(admin);
            const cart = new cart_entity_1.Cart();
            await this.cartRepository.save(cart);
            const studentUrl = this.configService.get('STUDENT_URL');
            const subjectImageUrls = {};
            const seenImages = new Set();
            for (const categoryData of setup_1.default) {
                for (const courseData of categoryData.courses) {
                    if (seenImages.has(courseData.courseName))
                        continue;
                    seenImages.add(courseData.courseName);
                    const { filename, mime, ext } = courseData.imageFile;
                    const img = new image_entity_1.Image();
                    img.path = `seed-${courseData.courseName.toLowerCase().replace(/\s+/g, '-')}-question.${ext}`;
                    img.original_name = filename;
                    img.mime_type = mime;
                    img.buffer = fs.readFileSync(path.resolve(path.join(__dirname, '/data/', filename)));
                    await this.imageRepository.save(img);
                    subjectImageUrls[courseData.courseName] = `${studentUrl}/api/images/${img.path}`;
                }
            }
            const courseMap = new Map();
            for (const categoryData of setup_1.default) {
                for (const courseData of categoryData.courses) {
                    if (courseMap.has(courseData.courseName))
                        continue;
                    const course = new course_entity_1.Course();
                    course.title = courseData.courseName;
                    course.description = `${courseData.courseName} exam preparation course`;
                    course.avatar_url =
                        subjectImageUrls[courseData.courseName] ||
                            subjectImageUrls['Mathematics'];
                    course.currency = course_entity_1.CurrencyType.USD;
                    course.domains = [course_entity_1.DomainType.ENGLISH];
                    course.level = course_entity_1.LevelType.BEGINNER;
                    course.price = 100;
                    course.is_mandatory = courseData.is_mandatory;
                    course.instructor = instructor;
                    course.organization = organization;
                    await this.courseRepository.save(course);
                    const version = new version_entity_1.Version();
                    version.status = version_entity_1.VersionStatusType.APPROVED;
                    version.version_number = 1;
                    version.course = course;
                    version.assigned_admin = admin;
                    await this.versionRepository.save(version);
                    for (const suiteData of courseData.suites) {
                        const suite = new test_suite_entity_1.TestSuite();
                        suite.title = suiteData.suiteName;
                        suite.description = suiteData.suiteDescription;
                        suite.keywords = suiteData.suiteKeywords;
                        suite.suite_type =
                            ('suiteType' in suiteData
                                ? suiteData.suiteType
                                : null) ?? test_suite_entity_1.SuiteType.YEAR;
                        suite.image_url =
                            subjectImageUrls[courseData.courseName] ||
                                subjectImageUrls['Mathematics'];
                        suite.course_version = version;
                        await this.testSuiteRepository.save(suite);
                        const questions = suiteData.questions.map((q) => {
                            const question = new question_entity_1.Question();
                            question.question_number = q.question_number;
                            question.description = q.description.replace('/v1/images/seed-sample-question.png', subjectImageUrls[courseData.courseName] ||
                                subjectImageUrls['Mathematics']);
                            question.hints = q.hints;
                            question.solution_steps = q.solution_steps;
                            question.options = q.options;
                            question.type = q.type;
                            question.tags = q.tags;
                            question.difficulty = q.difficulty;
                            question.estimated_time_in_ms = q.estimated_time_in_ms;
                            question.class_level = q.class_level;
                            question.exam_year = q.exam_year;
                            question.correct_answer = q.correct_answer;
                            if (q.marks !== undefined)
                                question.marks = q.marks;
                            question.version = version;
                            question.test_suite = suite;
                            return question;
                        });
                        await this.questionRepository.save(questions);
                    }
                    course.approved_version = version;
                    await this.courseRepository.save(course);
                    courseMap.set(courseData.courseName, course);
                }
            }
            for (const categoryData of setup_1.default) {
                const courses = categoryData.courses
                    .map((c) => courseMap.get(c.courseName))
                    .filter((c) => c !== undefined);
                const category = new category_entity_1.Category();
                category.name = categoryData.categoryName;
                category.avatar_url = 'https://example.com/avatar.jpg';
                category.organization = organization;
                category.courses = courses;
                await this.categoryRepository.save(category);
            }
            await this.setupSubscriptionPlans();
            this.logger.log('Database setup complete.');
        }
        catch (err) {
            this.logger.error('Database setup failed', err);
        }
    }
    async setupSubscriptionPlans() {
        for (const planData of setup_1.plans) {
            const existing = await this.planRepository.findOne({
                where: { plan_key: planData.plan_key },
            });
            if (!existing) {
                const plan = this.planRepository.create(planData);
                await this.planRepository.save(plan);
            }
        }
    }
};
exports.SetupDbService = SetupDbService;
exports.SetupDbService = SetupDbService = SetupDbService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(1, (0, typeorm_1.InjectRepository)(instructor_entity_1.Instructor)),
    __param(2, (0, typeorm_1.InjectRepository)(admin_entity_1.Admin)),
    __param(3, (0, typeorm_1.InjectRepository)(course_entity_1.Course)),
    __param(4, (0, typeorm_1.InjectRepository)(version_entity_1.Version)),
    __param(5, (0, typeorm_1.InjectRepository)(test_suite_entity_1.TestSuite)),
    __param(6, (0, typeorm_1.InjectRepository)(question_entity_1.Question)),
    __param(7, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(8, (0, typeorm_1.InjectRepository)(cart_entity_1.Cart)),
    __param(9, (0, typeorm_1.InjectRepository)(image_entity_1.Image)),
    __param(10, (0, typeorm_1.InjectRepository)(subscription_plan_entity_1.SubscriptionPlan)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], SetupDbService);
//# sourceMappingURL=setup-db-2.service.js.map