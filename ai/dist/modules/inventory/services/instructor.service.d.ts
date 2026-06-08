import { Repository } from 'typeorm';
import { Instructor } from '../../auth/entities/instructor.entity';
import { Question } from '../../review/entities/question.entity';
import { ReviewRequest } from '../../review/entities/review_request.entity';
import { Version } from '../../review/entities/version.entity';
import { Course as CourseTypeClass } from '../entities/course.entity';
import { Version as VersionTypeClass } from '../../review/entities/version.entity';
import { CourseInfoInput, QuestionInput } from '../inputs';
export declare class InstructorService {
    private instructorRepository;
    constructor(instructorRepository: Repository<Instructor>);
    createCourse({ email, courseInfo, organizationId, }: {
        email: string;
        courseInfo: CourseInfoInput;
        organizationId: string;
    }): Promise<CourseTypeClass>;
    updateCourse({ email }: {
        email: string;
    }): Promise<void>;
    addCourseVersion({ email, courseId, }: {
        email: string;
        courseId: string;
    }): Promise<VersionTypeClass>;
    addQuestionsToCourseVersion({ email, versionId, suiteTitle, suiteDescription, suiteKeywords, questions, }: {
        email: string;
        versionId: string;
        suiteTitle: string;
        suiteDescription: string;
        suiteKeywords: string[];
        questions: QuestionInput[];
    }): Promise<Version>;
    updateQuestion({ email, questionId, question, }: {
        email: string;
        questionId: string;
        question: QuestionInput;
    }): Promise<Question>;
    requestCourseVersionReview({ email, versionId, }: {
        email: string;
        versionId: string;
    }): Promise<ReviewRequest>;
}
