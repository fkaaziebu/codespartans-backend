import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Admin } from '../entities/admin.entity';
import { AdminLoginResponse } from '../types';
export declare class AdminService {
    private adminRepository;
    private jwtService;
    constructor(adminRepository: Repository<Admin>, jwtService: JwtService);
    loginAdmin({ email, password, }: {
        email: string;
        password: string;
    }): Promise<AdminLoginResponse>;
}
