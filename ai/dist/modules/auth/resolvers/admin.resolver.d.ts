import { AdminService } from '../services';
import { AdminLoginResponse } from '../types';
export declare class AdminResolver {
    private readonly adminService;
    constructor(adminService: AdminService);
    loginAdmin(email: string, password: string): Promise<AdminLoginResponse>;
}
