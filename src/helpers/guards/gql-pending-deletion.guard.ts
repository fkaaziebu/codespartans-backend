import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GqlPendingDeletionGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const req = GqlExecutionContext.create(context).getContext().req;
    if (!req.user?.is_pending_deletion) {
      throw new ForbiddenException(
        'This action requires a pending-deletion token.',
      );
    }
    return true;
  }
}
