import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { DemoStatus } from 'src/modules/demo/entities/school-demo.entity';
import { OrgSubscription, SubscriptionStatus } from 'src/modules/demo/entities/organization-subscription.entity';
import { Organization } from 'src/modules/auth/entities/organization.entity';
import { Student } from 'src/modules/auth/entities/student.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(OrgSubscription)
    private readonly orgSubscriptionRepo: Repository<OrgSubscription>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;

    // Not authenticated — let GqlJwtAuthGuard handle it
    if (!user) return true;

    const { email, role } = user;

    if (role === 'STUDENT') {
      return this.checkStudentAccess(email);
    }

    if (role === 'ORGANIZATION') {
      return this.checkOrgAccess(email);
    }

    // INSTRUCTOR, ADMIN, PARENT, CHILD — not gated
    return true;
  }

  private async checkStudentAccess(email: string): Promise<boolean> {
    const student = await this.studentRepo.findOne({
      where: { email },
      relations: ['organizations', 'organizations.school_demo'],
    });

    if (!student || !student.organizations?.length) {
      // Independent student — not gated by org subscription
      return true;
    }

    for (const org of student.organizations) {
      if (await this.orgHasValidAccess(org)) return true;
    }

    throw new ForbiddenException({
      code: 'SUBSCRIPTION_REQUIRED',
      message:
        "Your school's access has expired. Please contact your school administrator to renew.",
    });
  }

  private async checkOrgAccess(email: string): Promise<boolean> {
    const org = await this.orgRepo.findOne({
      where: { email },
      relations: ['school_demo'],
    });

    if (!org) throw new ForbiddenException('Organization not found');

    if (await this.orgHasValidAccess(org)) return true;

    throw new ForbiddenException({
      code: 'SUBSCRIPTION_REQUIRED',
      message:
        'Your free trial has ended. Please subscribe to a plan to continue.',
    });
  }

  private async orgHasValidAccess(org: Organization): Promise<boolean> {
    const now = new Date();

    // Active demo that hasn't expired
    if (
      org.school_demo &&
      org.school_demo.status === DemoStatus.ACTIVE &&
      org.school_demo.expires_at > now
    ) {
      return true;
    }

    // Active paid subscription that hasn't expired
    const activeSub = await this.orgSubscriptionRepo.findOne({
      where: { organization: { id: org.id }, status: SubscriptionStatus.ACTIVE },
      order: { expires_at: 'DESC' },
    });

    if (activeSub && activeSub.expires_at > now) return true;

    return false;
  }
}
