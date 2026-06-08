import { Observable } from 'rxjs';
import { StudentGateway } from '../gateways/student.gateway';
import { StudentService } from '../services';
export declare class StartTestDto {
    testId: string;
    studentId: string;
}
export declare class PauseTestDto {
    testId: string;
    studentId: string;
}
export declare class ResumeTestDto {
    testId: string;
    studentId: string;
}
export declare class StudentController {
    private studentService;
    private sseGateway;
    private readonly logger;
    constructor(studentService: StudentService, sseGateway: StudentGateway);
    streamTestTime(testId: string, studentId: string): Observable<MessageEvent>;
    streamActiveTests(studentId: string): Promise<Observable<MessageEvent>>;
}
