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
exports.OrganizationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const version_entity_1 = require("../../review/entities/version.entity");
const helpers_1 = require("../../../helpers");
const typeorm_2 = require("typeorm");
const admin_entity_1 = require("../../auth/entities/admin.entity");
const instructor_entity_1 = require("../../auth/entities/instructor.entity");
const organization_entity_1 = require("../../auth/entities/organization.entity");
const category_entity_1 = require("../entities/category.entity");
const course_entity_1 = require("../entities/course.entity");
const version_entity_2 = require("../../review/entities/version.entity");
let OrganizationService = class OrganizationService {
    constructor(organizationRepository, courseRepository, categoryRepository) {
        this.organizationRepository = organizationRepository;
        this.courseRepository = courseRepository;
        this.categoryRepository = categoryRepository;
    }
    async listInstructorsPaginated({ email, searchTerm, pagination, }) {
        const instructors = await this.listInstructors({
            email,
            searchTerm,
        });
        return helpers_1.PaginateHelper.paginate(instructors, pagination, (instructor) => instructor.id.toString());
    }
    async listAdminsPaginated({ email, searchTerm, pagination, }) {
        const admins = await this.listAdmins({
            email,
            searchTerm,
        });
        return helpers_1.PaginateHelper.paginate(admins, pagination, (admin) => admin.id.toString());
    }
    async listCoursesPaginated({ email, searchTerm, pagination, }) {
        const courses = await this.listCourses({
            email,
            searchTerm,
        });
        return helpers_1.PaginateHelper.paginate(courses, pagination, (course) => course.id.toString());
    }
    async listCourses({ email, searchTerm, }) {
        const organization = await this.organizationRepository.findOne({
            where: {
                email,
            },
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organization not found');
        }
        const courses = await this.courseRepository.find({
            where: {
                organization: {
                    email,
                },
                title: searchTerm ? (0, typeorm_2.ILike)(`%${searchTerm.trim()}%`) : undefined,
            },
            relations: ['approved_version'],
        });
        return courses;
    }
    async listRequestedReviewsPaginated({ email, filter, pagination, }) {
        const requested_reviews = await this.listRequestedReviews({
            email,
            filter,
        });
        return helpers_1.PaginateHelper.paginate(requested_reviews, pagination, (requested_review) => requested_review.id.toString());
    }
    async listInstructors({ email, searchTerm, }) {
        return await this.organizationRepository.manager.transaction(async (transactionalEntityManager) => {
            const instructors = await transactionalEntityManager.find(instructor_entity_1.Instructor, {
                where: {
                    name: searchTerm ? (0, typeorm_2.ILike)(`%${searchTerm.trim()}%`) : undefined,
                    organizations: { email },
                },
                relations: [
                    'created_courses.approved_version',
                    'created_courses.versions.reviews',
                    'created_courses.versions.review_request',
                ],
            });
            return instructors.map((instructor) => ({
                ...instructor,
                total_created_courses: instructor.created_courses.length,
                total_requested_reviews: instructor.created_courses?.reduce((acc, course) => acc +
                    (course.versions?.reduce((acc, version) => acc + (version?.review_request ? 1 : 0), 0) || 0), 0),
                total_approved_courses: instructor.created_courses?.reduce((acc, course) => acc + (course?.approved_version ? 1 : 0), 0),
            }));
        });
    }
    async listAdmins({ email, searchTerm, }) {
        return await this.organizationRepository.manager.transaction(async (transactionalEntityManager) => {
            const admins = await transactionalEntityManager.find(admin_entity_1.Admin, {
                where: {
                    name: searchTerm ? (0, typeorm_2.ILike)(`%${searchTerm.trim()}%`) : undefined,
                    organization: { email },
                },
                relations: ['assigned_course_versions_for_review.course.instructor'],
            });
            return admins.map((admin) => ({
                ...admin,
                total_course_versions: admin.assigned_course_versions_for_review?.length,
                total_approved_course_versions: admin.assigned_course_versions_for_review?.reduce((acc, version) => acc + (version?.status === version_entity_1.VersionStatusType.APPROVED ? 1 : 0), 0),
            }));
        });
    }
    async listRequestedReviews({ email, filter, }) {
        return await this.organizationRepository.manager.transaction(async (transactionalEntityManager) => {
            const organization = await transactionalEntityManager.findOne(organization_entity_1.Organization, {
                where: {
                    email,
                    requested_reviews: {
                        course_version: {
                            status: filter?.status || undefined,
                            assigned_admin: {
                                id: filter?.adminId || undefined,
                            },
                            course: {
                                instructor: {
                                    id: filter?.instructorId || undefined,
                                },
                            },
                        },
                    },
                },
                relations: [
                    'requested_reviews.course_version.assigned_admin',
                    'requested_reviews.course_version.course.instructor',
                    'requested_reviews.course_version.course.approved_version',
                ],
            });
            if (!organization) {
                throw new common_1.NotFoundException('Organization not found');
            }
            return organization.requested_reviews;
        });
    }
    async getStats({ email }) {
        return await this.organizationRepository.manager.transaction(async (transactionalEntityManager) => {
            const organization = await transactionalEntityManager.findOne(organization_entity_1.Organization, {
                where: { email },
                relations: [
                    'admins.assigned_course_versions_for_review',
                    'instructors',
                    'requested_reviews.course_version',
                    'organizational_courses.approved_version',
                ],
            });
            if (!organization) {
                throw new common_1.NotFoundException('Organization does not exist');
            }
            return {
                total_admins: organization.admins.length,
                total_instructors: organization.instructors.length,
                total_requested_reviews: organization.requested_reviews.length,
                total_assigned_reviews: organization.admins.reduce((acc, admin) => acc + admin.assigned_course_versions_for_review.length, 0),
                total_completed_reviews: organization.requested_reviews.reduce((acc, review_req) => acc +
                    (review_req.course_version.status === version_entity_1.VersionStatusType.APPROVED
                        ? 1
                        : 0), 0),
            };
        });
    }
    async assignCourseVersionForReview({ email, versionId, adminId, }) {
        return await this.organizationRepository.manager.transaction(async (transactionalEntityManager) => {
            const organization = await transactionalEntityManager.findOne(organization_entity_1.Organization, {
                where: { email },
            });
            if (!organization) {
                throw new common_1.NotFoundException('Organization does not exist');
            }
            const admin = await transactionalEntityManager.findOne(admin_entity_1.Admin, {
                where: { id: adminId, organization: { email } },
            });
            if (!admin) {
                throw new Error('Admin does not exist');
            }
            const courseVersion = await transactionalEntityManager.findOne(version_entity_2.Version, {
                where: {
                    id: versionId,
                    review_request: {
                        organization: {
                            email,
                        },
                    },
                    course: {
                        organization: {
                            email,
                        },
                    },
                },
            });
            if (!courseVersion) {
                throw new common_1.NotFoundException('Course version not found');
            }
            courseVersion.assigned_admin = admin;
            courseVersion.status = version_entity_1.VersionStatusType.IN_PROGRESS;
            return await transactionalEntityManager.save(version_entity_2.Version, courseVersion);
        });
    }
    async createCategory({ email, categoryInfo, }) {
        return await this.organizationRepository.manager.transaction(async (transactionalEntityManager) => {
            const organization = await transactionalEntityManager.findOne(organization_entity_1.Organization, {
                where: { email },
            });
            if (!organization) {
                throw new common_1.NotFoundException('Organization does not exist');
            }
            const category = new category_entity_1.Category();
            category.avatar_url = categoryInfo.avatar_url;
            category.name = categoryInfo.name;
            category.organization = organization;
            return await transactionalEntityManager.save(category_entity_1.Category, category);
        });
    }
    async addCoursesToCategory({ email, categoryId, courseIds, }) {
        return await this.organizationRepository.manager.transaction(async (transactionalEntityManager) => {
            const organization = await transactionalEntityManager.findOne(organization_entity_1.Organization, {
                where: { email },
            });
            if (!organization) {
                throw new common_1.NotFoundException('Organization does not exist');
            }
            const category = await transactionalEntityManager.findOne(category_entity_1.Category, {
                where: { id: categoryId, organization: { email } },
            });
            if (!category) {
                throw new common_1.NotFoundException('Category does not exist');
            }
            const courses = await transactionalEntityManager.findByIds(course_entity_1.Course, courseIds);
            if (!courses.length) {
                throw new common_1.NotFoundException('Courses do not exist');
            }
            category.courses = courses;
            return await transactionalEntityManager.save(category_entity_1.Category, category);
        });
    }
};
exports.OrganizationService = OrganizationService;
exports.OrganizationService = OrganizationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(1, (0, typeorm_1.InjectRepository)(course_entity_1.Course)),
    __param(2, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], OrganizationService);
//# sourceMappingURL=organization.service.js.map