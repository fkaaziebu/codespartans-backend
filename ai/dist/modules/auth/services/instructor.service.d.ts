import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Instructor } from '../entities/instructor.entity';
import { InstructorLoginResponse } from '../types';
export declare class InstructorService {
    private instructorRepository;
    private jwtService;
    constructor(instructorRepository: Repository<Instructor>, jwtService: JwtService);
    loginInstructor({ email, password, }: {
        email: string;
        password: string;
    }): Promise<InstructorLoginResponse>;
}
