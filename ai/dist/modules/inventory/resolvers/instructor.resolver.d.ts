import { Course as CourseTypeClass } from 'src/modules/inventory/entities/course.entity';
import { Question as QuestionTypeClass } from 'src/modules/review/entities/question.entity';
import { ReviewRequest as ReviewRequestTypeClass } from 'src/modules/review/entities/review_request.entity';
import { Version as VersionTypeClass } from 'src/modules/review/entities/version.entity';
import { CourseInfoInput, QuestionInput, UpdateCourseInfoInput } from '../inputs';
import { InstructorService } from '../services';
export declare class InstructorResolver {
    private readonly instructorService;
    constructor(instructorService: InstructorService);
    createCourse(context: any, organizationId: string, courseInfo: CourseInfoInput): Promise<CourseTypeClass>;
    updateCourse(context: any, courseId: string, courseInfo: UpdateCourseInfoInput): Promise<void>;
    addCourseVersion(context: any, courseId: string): Promise<VersionTypeClass>;
    addQuestionsToCourseVersion(context: any, versionId: string, suiteTitle: string, suiteDescription: string, suiteKeywords: string[], questions: QuestionInput[]): Promise<VersionTypeClass>;
    updateQuestion(context: any, questionId: string, question: QuestionInput): Promise<QuestionTypeClass>;
    requestCourseVersionReview(context: any, versionId: string): Promise<ReviewRequestTypeClass>;
}
