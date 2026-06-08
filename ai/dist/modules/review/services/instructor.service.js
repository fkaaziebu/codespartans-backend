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
const typeorm_1 = require("@nestjs/typeorm");
const helpers_1 = require("../../../helpers");
const typeorm_2 = require("typeorm");
const instructor_entity_1 = require("../../auth/entities/instructor.entity");
const course_entity_1 = require("../../inventory/entities/course.entity");
const issue_entity_1 = require("../entities/issue.entity");
const question_entity_1 = require("../entities/question.entity");
const review_entity_1 = require("../entities/review.entity");
const version_entity_1 = require("../entities/version.entity");
const issue_entity_2 = require("../entities/issue.entity");
let InstructorService = class InstructorService {
    constructor(instructorRepository) {
        this.instructorRepository = instructorRepository;
    }
    async getVersionReview({ email, reviewId, }) {
        return this.instructorRepository.manager.transaction(async (transactionalEntityManager) => {
            const review = await transactionalEntityManager.findOne(review_entity_1.Review, {
                where: {
                    id: reviewId,
                    course_version: {
                        course: {
                            instructor: {
                                email,
                            },
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
    async listQuestionsForVersionPaginated({ email, versionId, searchTerm, pagination, }) {
        const questions = await this.listQuestionsForVersion({
            email,
            versionId,
            searchTerm,
        });
        return helpers_1.PaginateHelper.paginate(questions, pagination, (question) => question.id.toString());
    }
    async listQuestionsForVersion({ email, versionId, searchTerm, }) {
        return await this.instructorRepository.manager.transaction(async (transactionalEntityManager) => {
            const questions = await transactionalEntityManager.find(question_entity_1.Question, {
                where: {
                    description: searchTerm
                        ? (0, typeorm_2.ILike)(`%${searchTerm.trim()}%`)
                        : undefined,
                    version: {
                        id: versionId,
                        course: {
                            instructor: {
                                email,
                            },
                        },
                    },
                },
            });
            return questions;
        });
    }
    async getCourseVersion({ email, versionId, }) {
        return this.instructorRepository.manager.transaction(async (transactionalEntityManager) => {
            const version = await transactionalEntityManager.findOne(version_entity_1.Version, {
                where: {
                    id: versionId,
                    course: {
                        instructor: {
                            email,
                        },
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
    async getCourse({ email, courseId, }) {
        return await this.instructorRepository.manager.transaction(async (transactionalEntityManager) => {
            const course = await transactionalEntityManager.findOne(course_entity_1.Course, {
                where: {
                    id: courseId,
                    instructor: {
                        email,
                    },
                },
                relations: [
                    'approved_version.questions',
                    'approved_version.assigned_admin',
                    'versions.questions',
                    'versions.assigned_admin',
                ],
            });
            return course;
        });
    }
    async listCoursesPaginated({ email, searchTerm, pagination, }) {
        const courses = await this.listCourses({
            email,
            searchTerm,
        });
        return helpers_1.PaginateHelper.paginate(courses, pagination, (course) => course.id.toString());
    }
    async listCourses({ email, searchTerm, }) {
        return await this.instructorRepository.manager.transaction(async (transactionalEntityManager) => {
            const courses = await transactionalEntityManager.find(course_entity_1.Course, {
                where: {
                    title: searchTerm ? (0, typeorm_2.ILike)(`%${searchTerm.trim()}%`) : undefined,
                    instructor: {
                        email,
                    },
                },
                relations: ['approved_version', 'versions'],
            });
            return courses;
        });
    }
    async updateIssueStatus({ email, issueId, issueStatus, response, }) {
        return await this.instructorRepository.manager.transaction(async (transactionalEntityManager) => {
            const instructor = await transactionalEntityManager.findOne(instructor_entity_1.Instructor, {
                where: { email },
            });
            if (!instructor) {
                throw new common_1.NotFoundException('Instructor does not exist');
            }
            const issue = await transactionalEntityManager.findOne(issue_entity_1.Issue, {
                where: {
                    id: issueId,
                    review: {
                        course_version: {
                            course: {
                                instructor: {
                                    email,
                                },
                            },
                        },
                    },
                },
            });
            if (!issue) {
                throw new common_1.NotFoundException('Issue not found');
            }
            issue.status = issueStatus;
            issue.response = response;
            return transactionalEntityManager.save(issue_entity_1.Issue, issue);
        });
    }
};
exports.InstructorService = InstructorService;
exports.InstructorService = InstructorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(instructor_entity_1.Instructor)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], InstructorService);
//# sourceMappingURL=instructor.service.js.map