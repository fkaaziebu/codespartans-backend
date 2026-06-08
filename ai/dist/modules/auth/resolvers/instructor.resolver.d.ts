import { InstructorService } from '../services/instructor.service';
import { InstructorLoginResponse } from '../types';
export declare class InstructorResolver {
    private readonly instructorService;
    constructor(instructorService: InstructorService);
    loginInstructor(email: string, password: string): Promise<InstructorLoginResponse>;
}
