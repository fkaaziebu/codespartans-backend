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
const typeorm_2 = require("typeorm");
const instructor_entity_1 = require("../../auth/entities/instructor.entity");
const organization_entity_1 = require("../../auth/entities/organization.entity");
const course_entity_1 = require("../entities/course.entity");
const question_entity_1 = require("../../review/entities/question.entity");
const review_request_entity_1 = require("../../review/entities/review_request.entity");
const test_suite_entity_1 = require("../../review/entities/test_suite.entity");
const version_entity_1 = require("../../review/entities/version.entity");
let InstructorService = class InstructorService {
    constructor(instructorRepository) {
        this.instructorRepository = instructorRepository;
    }
    async createCourse({ email, courseInfo, organizationId, }) {
        return await this.instructorRepository.manager.transaction(async (transactionalEntityManager) => {
            const instructor = await transactionalEntityManager.findOne(instructor_entity_1.Instructor, {
                where: { email },
            });
            if (!instructor) {
                throw new common_1.NotFoundException('Instructor does not exist');
            }
            const organization = await transactionalEntityManager.findOne(organization_entity_1.Organization, {
                where: {
                    id: organizationId,
                    instructors: {
                        id: instructor.id,
                    },
                },
            });
            if (!organization) {
                throw new common_1.NotFoundException('Instructor does not belong to the organization');
            }
            const newCourse = new course_entity_1.Course();
            newCourse.avatar_url = courseInfo.avatar_url;
            newCourse.currency = courseInfo.currency;
            newCourse.description = courseInfo.description;
            newCourse.domains = courseInfo.domains;
            newCourse.level = courseInfo.level;
            newCourse.price = courseInfo.price;
            newCourse.title = courseInfo.title;
            newCourse.instructor = instructor;
            newCourse.organization = organization;
            return await transactionalEntityManager.save(newCourse);
        });
    }
    async updateCourse({ email }) {
    }
    async addCourseVersion({ email, courseId, }) {
        return await this.instructorRepository.manager.transaction(async (transactionalEntityManager) => {
            const instructor = await transactionalEntityManager.findOne(instructor_entity_1.Instructor, {
                where: { email },
            });
            if (!instructor) {
                throw new common_1.NotFoundException('Instructor does not exist');
            }
            const course = await transactionalEntityManager.findOne(course_entity_1.Course, {
                where: {
                    id: courseId,
                },
                relations: ['versions'],
            });
            if (!course) {
                throw new common_1.NotFoundException('Course not found');
            }
            const newVersion = new version_entity_1.Version();
            newVersion.version_number = course.versions.length + 1;
            newVersion.course = course;
            return await transactionalEntityManager.save(newVersion);
        });
    }
    async addQuestionsToCourseVersion({ email, versionId, suiteTitle, suiteDescription, suiteKeywords, questions, }) {
        return await this.instructorRepository.manager.transaction(async (transactionalEntityManager) => {
            const instructor = await transactionalEntityManager.findOne(instructor_entity_1.Instructor, {
                where: { email },
            });
            if (!instructor) {
                throw new common_1.NotFoundException('Instructor does not exist');
            }
            const courseVersion = await transactionalEntityManager.findOne(version_entity_1.Version, {
                where: {
                    id: versionId,
                    course: {
                        instructor: {
                            email,
                        },
                    },
                },
                relations: ['course'],
            });
            if (!courseVersion) {
                throw new common_1.NotFoundException('Course version not found');
            }
            const new_suite = new test_suite_entity_1.TestSuite();
            new_suite.title = suiteTitle;
            new_suite.description = suiteDescription;
            new_suite.keywords = suiteKeywords;
            new_suite.course_version = courseVersion;
            await transactionalEntityManager.save(new_suite);
            const new_questions = await Promise.all(questions.map(async (question) => {
                const new_question = new question_entity_1.Question();
                new_question.correct_answer = question.correct_answer;
                new_question.description = question.description;
                new_question.difficulty = question.difficulty;
                new_question.estimated_time_in_ms = question.estimated_time_in_ms;
                new_question.hints = question.hints;
                new_question.options = question.options;
                new_question.question_number = question.question_number;
                new_question.solution_steps = question.solution_steps;
                new_question.tags = question.tags;
                new_question.type = question.type;
                if (question.marks !== undefined) {
                    new_question.marks = question.marks;
                }
                new_question.version = courseVersion;
                new_question.test_suite = new_suite;
                return new_question;
            }));
            const saved_questions = await transactionalEntityManager.save(new_questions);
            return { ...courseVersion, questions: saved_questions };
        });
    }
    async updateQuestion({ email, questionId, question, }) {
        return await this.instructorRepository.manager.transaction(async (transactionalEntityManager) => {
            const instructor = await transactionalEntityManager.findOne(instructor_entity_1.Instructor, {
                where: { email },
            });
            if (!instructor) {
                throw new common_1.NotFoundException('Instructor does not exist');
            }
            const questionToUpdate = await transactionalEntityManager.findOne(question_entity_1.Question, {
                where: {
                    id: questionId,
                    version: {
                        course: {
                            instructor: {
                                email,
                            },
                        },
                    },
                },
            });
            if (!questionToUpdate) {
                throw new common_1.NotFoundException('Question not found');
            }
            questionToUpdate.correct_answer =
                question.correct_answer || questionToUpdate.correct_answer;
            questionToUpdate.description =
                question.description || questionToUpdate.description;
            questionToUpdate.difficulty =
                question.difficulty || questionToUpdate.difficulty;
            questionToUpdate.estimated_time_in_ms =
                question.estimated_time_in_ms ||
                    questionToUpdate.estimated_time_in_ms;
            questionToUpdate.hints = question.hints || questionToUpdate.hints;
            questionToUpdate.options = question.options || questionToUpdate.options;
            questionToUpdate.question_number =
                question.question_number || questionToUpdate.question_number;
            questionToUpdate.solution_steps =
                question.solution_steps || questionToUpdate.solution_steps;
            questionToUpdate.tags = question.tags || questionToUpdate.tags;
            questionToUpdate.type = question.type || questionToUpdate.type;
            return await transactionalEntityManager.save(questionToUpdate);
        });
    }
    async requestCourseVersionReview({ email, versionId, }) {
        return await this.instructorRepository.manager.transaction(async (transactionalEntityManager) => {
            const instructor = await transactionalEntityManager.findOne(instructor_entity_1.Instructor, {
                where: { email },
            });
            if (!instructor) {
                throw new common_1.NotFoundException('Instructor does not exist');
            }
            const courseVersion = await transactionalEntityManager.findOne(version_entity_1.Version, {
                where: {
                    id: versionId,
                    course: {
                        instructor: {
                            email,
                        },
                    },
                },
                relations: ['course.organization'],
            });
            if (!courseVersion) {
                throw new common_1.NotFoundException('Course version not found');
            }
            const reviewRequest = new review_request_entity_1.ReviewRequest();
            reviewRequest.course_version = courseVersion;
            reviewRequest.organization = courseVersion.course.organization;
            return await transactionalEntityManager.save(reviewRequest);
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