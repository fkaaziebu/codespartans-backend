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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const version_entity_1 = require("../entities/version.entity");
const helpers_1 = require("../../../helpers");
const typeorm_2 = require("typeorm");
const admin_entity_1 = require("../../auth/entities/admin.entity");
const course_entity_1 = require("../../inventory/entities/course.entity");
const issue_entity_1 = require("../entities/issue.entity");
const question_entity_1 = require("../entities/question.entity");
const review_entity_1 = require("../entities/review.entity");
const version_entity_2 = require("../entities/version.entity");
const issue_entity_2 = require("../entities/issue.entity");
const review_entity_2 = require("../entities/review.entity");
const meilisearch_producer_1 = require("./meilisearch.producer");
let AdminService = class AdminService {
    constructor(adminRepository, meilisearchProducer) {
        this.adminRepository = adminRepository;
        this.meilisearchProducer = meilisearchProducer;
    }
    async listQuestionsForVersionPaginated({ email, versionId, searchTerm, pagination, }) {
        const questions = await this.listQuestionsForVersion({
            email,
            versionId,
            searchTerm,
        });
        return helpers_1.PaginateHelper.paginate(questions, pagination, (question) => question.id.toString());
    }
    async listQuestionsForVersion({ email, versionId, searchTerm, }) {
        return await this.adminRepository.manager.transaction(async (transactionalEntityManager) => {
            const questions = await transactionalEntityManager.find(question_entity_1.Question, {
                where: {
                    description: searchTerm
                        ? (0, typeorm_2.ILike)(`%${searchTerm.trim()}%`)
                        : undefined,
                    version: {
                        id: versionId,
                        assigned_admin: {
                            email,
                        },
                    },
                },
            });
            return questions;
        });
    }
    async listAssignedVersionsPaginated({ email, searchTerm, pagination, }) {
        const versions = await this.listAssignedVersions({
            email,
            searchTerm,
        });
        return helpers_1.PaginateHelper.paginate(versions, pagination, (version) => version.id.toString());
    }
    async listAssignedVersions({ email, searchTerm, }) {
        return this.adminRepository.manager.transaction(async (transactionalEntityManager) => {
            const versions = await transactionalEntityManager.find(version_entity_2.Version, {
                where: {
                    course: {
                        title: searchTerm ? (0, typeorm_2.ILike)(`%${searchTerm.trim()}%`) : undefined,
                    },
                    assigned_admin: {
                        email,
                    },
                },
                relations: ['course', 'review_request', 'reviews', 'questions'],
            });
            return versions.map((version) => ({
                ...version,
                total_questions: version.questions.length,
                total_reviews: version.reviews.length,
            }));
        });
    }
    async getCourseVersion({ email, versionId, }) {
        return this.adminRepository.manager.transaction(async (transactionalEntityManager) => {
            const version = await transactionalEntityManager.findOne(version_entity_2.Version, {
                where: {
                    id: versionId,
                    assigned_admin: {
                        email,
                    },
                },
                relations: [
                    'questions',
                    'reviews',
                    'course.instructor',
                    'review_request',
                    'reviews.issues',
                ],
            });
            return {
                ...version,
                reviews: version.reviews.map((review) => ({
                    ...review,
                    total_issues: review.issues.filter((issue) => issue.status !== issue_entity_2.IssueStatusType.CLOSED).length,
                })),
                total_questions: version.questions.length,
                total_reviews: version.reviews.length,
            };
        });
    }
    async getVersionReview({ email, reviewId, }) {
        return this.adminRepository.manager.transaction(async (transactionalEntityManager) => {
            const review = await transactionalEntityManager.findOne(review_entity_1.Review, {
                where: {
                    id: reviewId,
                    course_version: {
                        assigned_admin: {
                            email,
                        },
                    },
                },
                relations: [
                    'course_version.questions',
                    'course_version.course',
                    'issues',
                ],
            });
            return review;
        });
    }
    async addCourseVersionReview({ email, versionId, reviewInfo, }) {
        return await this.adminRepository.manager.transaction(async (transactionalEntityManager) => {
            const admin = await transactionalEntityManager.findOne(admin_entity_1.Admin, {
                where: { email },
            });
            if (!admin) {
                throw new common_1.NotFoundException('Admin does not exist');
            }
            const courseVersion = await transactionalEntityManager.findOne(version_entity_2.Version, {
                where: {
                    id: versionId,
                    assigned_admin: {
                        email,
                    },
                },
            });
            if (!courseVersion) {
                throw new common_1.NotFoundException('Course version not found');
            }
            const review = new review_entity_1.Review();
            review.title = reviewInfo.title;
            review.message = reviewInfo.message;
            review.course_version = courseVersion;
            return await transactionalEntityManager.save(review_entity_1.Review, review);
        });
    }
    async addReviewIssue({ email, reviewId, issueInfo, }) {
        return await this.adminRepository.manager.transaction(async (transactionalEntityManager) => {
            const admin = await transactionalEntityManager.findOne(admin_entity_1.Admin, {
                where: { email },
            });
            if (!admin) {
                throw new common_1.NotFoundException('Admin does not exist');
            }
            const review = await transactionalEntityManager.findOne(review_entity_1.Review, {
                where: {
                    id: reviewId,
                    course_version: {
                        assigned_admin: {
                            email,
                        },
                    },
                },
            });
            if (!review) {
                throw new common_1.NotFoundException('Review not found');
            }
            const issue = new issue_entity_1.Issue();
            issue.description = issueInfo.description;
            issue.review = review;
            return await transactionalEntityManager.save(issue_entity_1.Issue, issue);
        });
    }
    async closeIssue({ email, issueId, }) {
        return await this.adminRepository.manager.transaction(async (transactionalEntityManager) => {
            const admin = await transactionalEntityManager.findOne(admin_entity_1.Admin, {
                where: { email },
            });
            if (!admin) {
                throw new common_1.NotFoundException('Admin does not exist');
            }
            const issue = await transactionalEntityManager.findOne(issue_entity_1.Issue, {
                where: {
                    id: issueId,
                    review: {
                        course_version: {
                            assigned_admin: {
                                email,
                            },
                        },
                    },
                },
            });
            if (!issue) {
                throw new common_1.NotFoundException('Issue not found');
            }
            issue.status = issue_entity_2.IssueStatusType.CLOSED;
            return await transactionalEntityManager.save(issue_entity_1.Issue, issue);
        });
    }
    async closeReview({ email, reviewId, }) {
        return await this.adminRepository.manager.transaction(async (transactionalEntityManager) => {
            const admin = await transactionalEntityManager.findOne(admin_entity_1.Admin, {
                where: { email },
            });
            if (!admin) {
                throw new common_1.NotFoundException('Admin does not exist');
            }
            const review = await transactionalEntityManager.findOne(review_entity_1.Review, {
                where: {
                    id: reviewId,
                    course_version: {
                        assigned_admin: {
                            email,
                        },
                    },
                },
            });
            if (!review) {
                throw new common_1.NotFoundException('Review not found');
            }
            review.status = review_entity_2.ReviewStatusType.CLOSED;
            return await transactionalEntityManager.save(review_entity_1.Review, review);
        });
    }
    async approveCourseVersion({ email, versionId, }) {
        return await this.adminRepository.manager.transaction(async (transactionalEntityManager) => {
            const admin = await transactionalEntityManager.findOne(admin_entity_1.Admin, {
                where: { email },
            });
            if (!admin) {
                throw new common_1.NotFoundException('Admin does not exist');
            }
            const courseVersion = await transactionalEntityManager.findOne(version_entity_2.Version, {
                where: {
                    id: versionId,
                    assigned_admin: {
                        email,
                    },
                },
                relations: ['course'],
            });
            if (!courseVersion) {
                throw new common_1.NotFoundException('Course version not found');
            }
            courseVersion.course.approved_version = courseVersion;
            courseVersion.status = version_entity_1.VersionStatusType.APPROVED;
            await transactionalEntityManager.save(version_entity_2.Version, courseVersion);
            await transactionalEntityManager.save(course_entity_1.Course, courseVersion.course);
            await this.meilisearchProducer.updateMeilisearchDocuments();
            return courseVersion;
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(admin_entity_1.Admin)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        meilisearch_producer_1.MeilisearchProducer])
], AdminService);
//# sourceMappingURL=admin.service.js.map