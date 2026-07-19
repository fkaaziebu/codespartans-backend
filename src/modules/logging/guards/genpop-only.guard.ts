import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin } from 'src/modules/auth/entities/admin.entity';
import { Organization } from 'src/modules/auth/entities/organization.entity';
import { Repository } from 'typeorm';

// Runtime log-level control is sensitive (it can be used to force verbose,
// PII-adjacent debug logging in prod) so it's restricted to the gen_pop
// organization: either the ORGANIZATION account itself, or an ADMIN that
// belongs to it. GENPOP_EMAIL is the same identifier already used in
// src/helpers/guards/subscription.guard.ts.
@Injectable()
export class GenpopOnlyGuard implements CanActivate {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;
    const genpopEmail = this.configService.get<string>('GENPOP_EMAIL');

    if (user?.role === 'ORGANIZATION') {
      const org = await this.orgRepo.findOne({ where: { id: user.id } });
      if (org?.email === genpopEmail) return true;
    }

    if (user?.role === 'ADMIN') {
      const admin = await this.adminRepo.findOne({
        where: { id: user.id },
        relations: ['organization'],
      });
      if (admin?.organization?.email === genpopEmail) return true;
    }

    throw new ForbiddenException(
      'Only the gen_pop organization can perform this action',
    );
  }
}
