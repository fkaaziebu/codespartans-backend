import { StudentService } from '../services/student.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConsentQueryDto } from '../dto/consent-query.dto';
import { ConsentInfoBodyDto } from '../dto/consent-info-body.dto';
export declare class StudentController {
    private readonly studentService;
    private jwtService;
    private configService;
    constructor(studentService: StudentService, jwtService: JwtService, configService: ConfigService);
    googleLogin(): void;
    googleCallback(req: any, res: any): Promise<any>;
    showConsentPage(consentQueryDto: ConsentQueryDto, res: any): Promise<any>;
    handleConsent(consentInfo: ConsentInfoBodyDto): Promise<{
        redirectUrl: string;
    }>;
}
