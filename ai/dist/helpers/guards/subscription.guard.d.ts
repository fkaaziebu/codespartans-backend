import { CanActivate, ExecutionContext } from '@nestjs/common';
import { OrgSubscription } from 'src/modules/demo/entities/organization-subscription.entity';
import { StudentSubscription } from 'src/modules/demo/entities/student-subscription.entity';
import { ParentSubscription } from 'src/modules/parent/entities/parent-subscription.entity';
import { Organization } from 'src/modules/auth/entities/organization.entity';
import { Student } from 'src/modules/auth/entities/student.entity';
import { Child } from 'src/modules/parent/entities/child.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
export declare class SubscriptionGuard implements CanActivate {
    private readonly studentRepo;
    private readonly orgRepo;
    private readonly orgSubscriptionRepo;
    private readonly studentSubscriptionRepo;
    private readonly childRepo;
    private readonly parentSubscriptionRepo;
    private configService;
    constructor(studentRepo: Repository<Student>, orgRepo: Repository<Organization>, orgSubscriptionRepo: Repository<OrgSubscription>, studentSubscriptionRepo: Repository<StudentSubscription>, childRepo: Repository<Child>, parentSubscriptionRepo: Repository<ParentSubscription>, configService: ConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private checkStudentAccess;
    private checkStudentSubscription;
    private checkOrgAccess;
    private checkChildAccess;
    private orgHasValidAccess;
}
