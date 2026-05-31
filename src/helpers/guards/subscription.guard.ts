import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { DemoStatus } from 'src/modules/demo/entities/school-demo.entity';
import {
  OrgSubscription,
  SubscriptionStatus,
} from 'src/modules/demo/entities/organization-subscription.entity';
import { StudentSubscription } from 'src/modules/demo/entities/student-subscription.entity';
import { ParentSubscription } from 'src/modules/parent/entities/parent-subscription.entity';
import { Organization } from 'src/modules/auth/entities/organization.entity';
import { Student } from 'src/modules/auth/entities/student.entity';
import { Child } from 'src/modules/parent/entities/child.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(OrgSubscription)
    private readonly orgSubscriptionRepo: Repository<OrgSubscription>,
    @InjectRepository(StudentSubscription)
    private readonly studentSubscriptionRepo: Repository<StudentSubscription>,
    @InjectRepository(Child)
    private readonly childRepo: Repository<Child>,
    @InjectRepository(ParentSubscription)
    private readonly parentSubscriptionRepo: Repository<ParentSubscription>,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;
    const user = req.user;

    // Not authenticated — let GqlJwtAuthGuard handle it
    if (!user) return true;

    const { email, role } = user;

    if (role === 'STUDENT') {
      return this.checkStudentAccess(email, req);
    }

    if (role === 'ORGANIZATION') {
      return this.checkOrgAccess(email);
    }

    if (role === 'CHILD') {
      return this.checkChildAccess(email);
    }

    // INSTRUCTOR, ADMIN, PARENT — not gated
    return true;
  }

  private async checkStudentAccess(email: string, req: any): Promise<boolean> {
    const student = await this.studentRepo.findOne({
      where: { email },
      relations: ['organizations', 'organizations.school_demo'],
    });

    if (!student) return true;

    const genpopEmail = this.configService.get<string>('GENPOP_EMAIL');

    // Check any non-GENPOP orgs first — if the student belongs to a paying school,
    // that school's subscription covers them.
    const nonGenpopOrgs = (student.organizations ?? []).filter(
      (org) => org.email !== genpopEmail,
    );

    for (const org of nonGenpopOrgs) {
      if (await this.orgHasValidAccess(org)) return true;
    }

    // Student is GENPOP-only, independent, or no non-GENPOP org has valid access.
    // They must have their own active subscription.
    return this.checkStudentSubscription(email, req);
  }

  private async checkStudentSubscription(
    email: string,
    req: any,
  ): Promise<boolean> {
    const now = new Date();
    const activeSub = await this.studentSubscriptionRepo.findOne({
      where: {
        student: { email },
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['plan'],
      order: { expires_at: 'DESC' },
    });

    if (activeSub && activeSub.expires_at > now) {
      // Mark free-trial students so resolvers can enforce plan limits
      // (1 subject access, 10 questions/day)
      if (activeSub.plan?.plan_key === 'student_free') {
        req.isStudentFreeTrial = true;
      }
      return true;
    }

    throw new GraphQLError(
      'You need an active subscription. Please subscribe to a plan to continue.',
      { extensions: { code: 'SUBSCRIPTION_REQUIRED' } },
    );
  }

  private async checkOrgAccess(email: string): Promise<boolean> {
    const org = await this.orgRepo.findOne({
      where: { email },
      relations: ['school_demo'],
    });

    if (!org) throw new ForbiddenException('Organization not found');

    if (await this.orgHasValidAccess(org)) return true;

    throw new GraphQLError(
      'Your free trial has ended. Please subscribe to a plan to continue.',
      { extensions: { code: 'SUBSCRIPTION_REQUIRED' } },
    );
  }

  private async checkChildAccess(studentEmail: string): Promise<boolean> {
    // CHILD JWT carries the linked student's email
    const child = await this.childRepo.findOne({
      where: { student: { email: studentEmail } },
      relations: ['parent'],
    });

    if (!child?.parent) {
      throw new GraphQLError(
        'Your parent needs an active subscription to unlock tests.',
        { extensions: { code: 'SUBSCRIPTION_REQUIRED' } },
      );
    }

    const now = new Date();

    // Check for an active subscription that explicitly covers this child
    const childSpecificSub = await this.parentSubscriptionRepo
      .createQueryBuilder('sub')
      .innerJoin('sub.children', 'child')
      .where('sub.parent.id = :parentId', { parentId: child.parent.id })
      .andWhere('child.id = :childId', { childId: child.id })
      .andWhere('sub.status = :status', { status: SubscriptionStatus.ACTIVE })
      .andWhere('sub.expires_at > :now', { now })
      .getOne();

    if (childSpecificSub) return true;

    // Backward compat: active subscriptions with no children entries cover all children
    const legacySub = await this.parentSubscriptionRepo
      .createQueryBuilder('sub')
      .leftJoin('sub.children', 'child')
      .where('sub.parent.id = :parentId', { parentId: child.parent.id })
      .andWhere('sub.status = :status', { status: SubscriptionStatus.ACTIVE })
      .andWhere('sub.expires_at > :now', { now })
      .groupBy('sub.id')
      .having('COUNT(child.id) = 0')
      .getOne();

    if (legacySub) return true;

    throw new GraphQLError(
      'Your parent needs an active subscription to unlock tests.',
      { extensions: { code: 'SUBSCRIPTION_REQUIRED' } },
    );
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
      where: {
        organization: { id: org.id },
        status: SubscriptionStatus.ACTIVE,
      },
      order: { expires_at: 'DESC' },
    });

    if (activeSub && activeSub.expires_at > now) return true;

    return false;
  }
}
