import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Job } from 'bullmq';
import { Student } from '../entities/student.entity';
import { Parent } from '../../parent/entities/parent.entity';
import { Child } from '../../parent/entities/child.entity';
import { Cart } from '../../inventory/entities/cart.entity';
import { Checkout } from '../../inventory/entities/checkout.entity';
import { Test } from '../../simulation/entities/test.entity';
import { TestAssignment } from '../../simulation/entities/test_assignment.entity';
import { StudentSubscription } from '../../demo/entities/student-subscription.entity';
import { ParentSubscription } from '../../parent/entities/parent-subscription.entity';
import { AccountDeletionProducer } from './account-deletion.producer';
import { EmailProducer } from './email.producer';
import {
  AccountDeletionResponse,
  AccountStatus,
} from '../types/account-deletion-response.type';
import {
  AuditAccountType,
  DeletionAuditEvent,
  DeletionAuditLog,
  PurgeReport,
  RequestMetadata,
} from '../entities/deletion-audit-log.entity';

const TTL_30D_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class AccountDeletionService {
  private readonly gracePeriodMs: number;

  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,
    @InjectRepository(Child)
    private childRepository: Repository<Child>,
    @InjectRepository(DeletionAuditLog)
    private auditRepository: Repository<DeletionAuditLog>,
    private readonly accountDeletionProducer: AccountDeletionProducer,
    private readonly emailProducer: EmailProducer,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.gracePeriodMs =
      this.configService.get<number>('ACCOUNT_DELETION_GRACE_DAYS') *
      24 *
      60 *
      60 *
      1000;
  }

  // ─── public API ──────────────────────────────────────────────────────────────

  async requestStudentAccountDeletion(
    studentId: string,
    meta: RequestMetadata | null = null,
  ): Promise<AccountDeletionResponse> {
    let student!: Student;
    let alreadyDeactivated = false;

    const deletionScheduledFor =
      await this.studentRepository.manager.transaction(async (em) => {
        student = await em.findOne(Student, {
          where: { id: studentId },
        });

        if (!student) {
          throw new NotFoundException('Student not found');
        }

        const linkedChild = await em.findOne(Child, {
          where: { student: { id: studentId } },
        });

        if (linkedChild) {
          throw new ForbiddenException(
            'Child accounts can only be deleted by a parent.',
          );
        }

        if (student.is_deactivated) {
          alreadyDeactivated = true;
          return new Date(
            student.deactivated_at!.getTime() + this.gracePeriodMs,
          );
        }

        await this.deactivateStudentInTx(em, student);

        return new Date(student.deactivated_at.getTime() + this.gracePeriodMs);
      });

    if (alreadyDeactivated) {
      await this.cacheManager.set(`deactivated:${studentId}`, '1', TTL_30D_MS);
      await this.writeAuditLog({
        event: DeletionAuditEvent.STUDENT_DELETION_ALREADY_PENDING,
        account_id: studentId,
        account_type: AuditAccountType.STUDENT,
        affected_child_ids: null,
        meta,
      });
      return {
        message: `Account deletion requested. Your account will be permanently deleted in ${this.daysUntil(deletionScheduledFor)} days, on ${deletionScheduledFor.toDateString()}. Log in any time before then to cancel.`,
        deletionScheduledFor,
        status: AccountStatus.PENDING_DELETION,
      };
    }

    // Schedule job and send email only after the transaction commits
    const jobId =
      await this.accountDeletionProducer.scheduleStudentPurge(studentId);
    student.deletion_job_id = jobId;
    await this.studentRepository.save(student);

    await this.emailProducer.sendAccountDeletionNotice({
      email: student.email,
      name: student.name,
      gracePeriodEnd: deletionScheduledFor.toDateString(),
      userType: 'student',
    });

    await this.cacheManager.set(`deactivated:${studentId}`, '1', TTL_30D_MS);

    await this.writeAuditLog({
      event: DeletionAuditEvent.STUDENT_DELETION_REQUESTED,
      account_id: studentId,
      account_type: AuditAccountType.STUDENT,
      affected_child_ids: null,
      meta,
    });

    return {
      message: `Account deletion requested. Your account will be permanently deleted in ${this.daysUntil(deletionScheduledFor)} days, on ${deletionScheduledFor.toDateString()}. Log in any time before then to cancel.`,
      deletionScheduledFor,
      status: AccountStatus.PENDING_DELETION,
    };
  }

  async requestParentAccountDeletion(
    parentId: string,
    meta: RequestMetadata | null = null,
  ): Promise<AccountDeletionResponse> {
    const deactivatedStudents: Student[] = [];
    let parent!: Parent;
    let alreadyDeactivated = false;

    const deletionScheduledFor =
      await this.parentRepository.manager.transaction(async (em) => {
        parent = await em.findOne(Parent, {
          where: { id: parentId },
          relations: ['children', 'children.student'],
        });

        if (!parent) {
          throw new NotFoundException('Parent not found');
        }

        if (parent.is_deactivated) {
          alreadyDeactivated = true;
          return new Date(
            parent.deactivated_at!.getTime() + this.gracePeriodMs,
          );
        }

        for (const child of parent.children ?? []) {
          if (child.student && !child.student.is_deactivated) {
            await this.deactivateStudentInTx(em, child.student);
            deactivatedStudents.push(child.student);
          }
        }

        parent.is_deactivated = true;
        parent.deactivated_at = new Date();
        await em.save(parent);

        return new Date(parent.deactivated_at.getTime() + this.gracePeriodMs);
      });

    if (alreadyDeactivated) {
      await this.cacheManager.set(`deactivated:${parentId}`, '1', TTL_30D_MS);
      await this.writeAuditLog({
        event: DeletionAuditEvent.PARENT_DELETION_ALREADY_PENDING,
        account_id: parentId,
        account_type: AuditAccountType.PARENT,
        affected_child_ids: null,
        meta,
      });
      return {
        message: `Account deletion requested. Your account will be permanently deleted in ${this.daysUntil(deletionScheduledFor)} days, on ${deletionScheduledFor.toDateString()}. Log in any time before then to cancel.`,
        deletionScheduledFor,
        status: AccountStatus.PENDING_DELETION,
      };
    }

    // Schedule jobs and send notifications only after the transaction commits
    for (const student of deactivatedStudents) {
      const jobId = await this.accountDeletionProducer.scheduleStudentPurge(
        student.id,
      );
      student.deletion_job_id = jobId;
      await this.studentRepository.save(student);
    }

    const parentJobId =
      await this.accountDeletionProducer.scheduleParentPurge(parentId);
    parent.deletion_job_id = parentJobId;
    await this.parentRepository.save(parent);

    await this.emailProducer.sendAccountDeletionNotice({
      email: parent.email,
      name: `${parent.first_name} ${parent.last_name}`,
      gracePeriodEnd: deletionScheduledFor.toDateString(),
      userType: 'parent',
      childCount: deactivatedStudents.length,
    });

    await Promise.all([
      this.cacheManager.set(`deactivated:${parentId}`, '1', TTL_30D_MS),
      ...deactivatedStudents.map((s) =>
        this.cacheManager.set(`deactivated:${s.id}`, '1', TTL_30D_MS),
      ),
    ]);

    const childStudentIds = deactivatedStudents.map((s) => s.id);
    await this.writeAuditLog({
      event: DeletionAuditEvent.PARENT_DELETION_REQUESTED,
      account_id: parentId,
      account_type: AuditAccountType.PARENT,
      affected_child_ids: childStudentIds.length ? childStudentIds : null,
      meta,
    });
    await Promise.all(
      deactivatedStudents.map((s) =>
        this.writeAuditLog({
          event: DeletionAuditEvent.CHILD_CASCADE_DEACTIVATED,
          account_id: s.id,
          account_type: AuditAccountType.STUDENT,
          affected_child_ids: null,
          meta,
        }),
      ),
    );

    return {
      message: `Account deletion requested. Your account will be permanently deleted in ${this.daysUntil(deletionScheduledFor)} days, on ${deletionScheduledFor.toDateString()}. Log in any time before then to cancel.`,
      deletionScheduledFor,
      status: AccountStatus.PENDING_DELETION,
    };
  }

  async deleteChild(
    parentEmail: string,
    childId: string,
    meta: RequestMetadata | null = null,
  ): Promise<AccountDeletionResponse> {
    let deactivatedStudent: Student | null = null;
    let deletionScheduledFor!: Date;
    let parentInfo!: { id: string; email: string; name: string };
    let childName!: string;

    await this.childRepository.manager.transaction(async (em) => {
      const child = await em.findOne(Child, {
        where: { id: childId },
        relations: ['parent', 'student'],
      });

      if (!child) {
        throw new NotFoundException('Child not found');
      }

      if (child.parent.email !== parentEmail) {
        throw new ForbiddenException(
          'You are not authorized to delete this child account',
        );
      }

      parentInfo = {
        id: child.parent.id,
        email: child.parent.email,
        name: `${child.parent.first_name} ${child.parent.last_name}`,
      };
      childName = child.student?.name ?? 'your child';

      if (child.student && !child.student.is_deactivated) {
        await this.deactivateStudentInTx(em, child.student);
        deactivatedStudent = child.student;
      }

      deletionScheduledFor = new Date(
        (child.student?.deactivated_at ?? new Date()).getTime() +
          this.gracePeriodMs,
      );
    });

    // Schedule job only after the transaction commits
    if (deactivatedStudent) {
      const jobId = await this.accountDeletionProducer.scheduleStudentPurge(
        deactivatedStudent.id,
      );
      deactivatedStudent.deletion_job_id = jobId;
      await this.studentRepository.save(deactivatedStudent);
      await this.cacheManager.set(
        `deactivated:${deactivatedStudent.id}`,
        '1',
        TTL_30D_MS,
      );
    }

    await this.emailProducer.sendChildDeletionNotice({
      parentEmail: parentInfo.email,
      parentName: parentInfo.name,
      childName,
      gracePeriodEnd: deletionScheduledFor.toDateString(),
    });

    await this.writeAuditLog({
      event: DeletionAuditEvent.CHILD_DELETION_REQUESTED,
      account_id: parentInfo.id,
      account_type: AuditAccountType.PARENT,
      affected_child_ids: deactivatedStudent ? [deactivatedStudent.id] : null,
      meta,
    });

    return {
      message: 'Child account deletion requested.',
      deletionScheduledFor,
      status: AccountStatus.PENDING_DELETION,
    };
  }

  async restoreStudent(
    student: Student,
    meta: RequestMetadata | null = null,
  ): Promise<void> {
    const jobIdToCancel = student.deletion_job_id;

    await this.studentRepository.manager.transaction(async (em) => {
      const linkedChild = await em.findOne(Child, {
        where: { student: { id: student.id } },
      });
      if (linkedChild) {
        throw new ForbiddenException(
          'Child account deletion can only be cancelled by the parent.',
        );
      }

      await this.reactivateStudentInTx(em, student);
    });

    // Cancel job and send email only after the DB commit succeeds
    if (jobIdToCancel) {
      await this.accountDeletionProducer.cancelJob(jobIdToCancel);
    }

    await this.cacheManager.del(`deactivated:${student.id}`);

    await this.writeAuditLog({
      event: DeletionAuditEvent.STUDENT_DELETION_CANCELLED,
      account_id: student.id,
      account_type: AuditAccountType.STUDENT,
      affected_child_ids: null,
      meta,
    });

    await this.emailProducer.sendAccountRestoredNotice({
      email: student.email,
      name: student.name,
    });
  }

  async restoreParent(
    parent: Parent,
    meta: RequestMetadata | null = null,
  ): Promise<void> {
    const parentWithChildren = await this.parentRepository.findOne({
      where: { id: parent.id },
      relations: ['children', 'children.student'],
    });

    const jobIdsToCancel: string[] = [];
    if (parent.deletion_job_id) {
      jobIdsToCancel.push(parent.deletion_job_id);
    }
    for (const child of parentWithChildren?.children ?? []) {
      if (child.student?.deletion_job_id) {
        jobIdsToCancel.push(child.student.deletion_job_id);
      }
    }

    await this.parentRepository.manager.transaction(async (em) => {
      for (const child of parentWithChildren?.children ?? []) {
        if (child.student?.is_deactivated) {
          await this.reactivateStudentInTx(em, child.student);
        }
      }

      parent.is_deactivated = false;
      parent.deactivated_at = null;
      parent.deletion_job_id = null;
      await em.save(parent);
    });

    // Cancel jobs and clear cache only after the DB commit succeeds
    await Promise.all(
      jobIdsToCancel.map((id) => this.accountDeletionProducer.cancelJob(id)),
    );

    await Promise.all([
      this.cacheManager.del(`deactivated:${parent.id}`),
      ...(parentWithChildren?.children ?? [])
        .filter((c) => c.student)
        .map((c) => this.cacheManager.del(`deactivated:${c.student!.id}`)),
    ]);

    await this.writeAuditLog({
      event: DeletionAuditEvent.PARENT_DELETION_CANCELLED,
      account_id: parent.id,
      account_type: AuditAccountType.PARENT,
      affected_child_ids: null,
      meta,
    });

    await this.emailProducer.sendAccountRestoredNotice({
      email: parent.email,
      name: `${parent.first_name} ${parent.last_name}`,
    });
  }

  async restoreChild(
    parentId: string,
    child: Child,
    meta: RequestMetadata | null = null,
  ): Promise<void> {
    const student = child.student!;
    const jobIdToCancel = student.deletion_job_id;

    await this.studentRepository.manager.transaction(async (em) => {
      await this.reactivateStudentInTx(em, student);
    });

    if (jobIdToCancel) {
      await this.accountDeletionProducer.cancelJob(jobIdToCancel);
    }

    await this.cacheManager.del(`deactivated:${student.id}`);

    await this.writeAuditLog({
      event: DeletionAuditEvent.CHILD_DELETION_CANCELLED,
      account_id: parentId,
      account_type: AuditAccountType.PARENT,
      affected_child_ids: [student.id],
      meta,
    });

    // await this.emailProducer.sendAccountRestoredNotice({
    //   email: student.email,
    //   name: student.name,
    // });
  }

  async permanentlyPurgeStudent(studentId: string): Promise<void> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: [
        'cart',
        'checkouts',
        'tests',
        'organizations',
        'subscribed_courses',
        'subscribed_categories',
      ],
    });

    if (!student || !student.is_deactivated) {
      return;
    }

    const email = student.email;
    const name = student.name;
    let purgeReport!: PurgeReport;

    await this.studentRepository.manager.transaction(async (em) => {
      purgeReport = await this.purgeStudentInTx(em, student);
    });

    await this.writeAuditLog({
      event: DeletionAuditEvent.STUDENT_ACCOUNT_PURGED,
      account_id: studentId,
      account_type: AuditAccountType.STUDENT,
      affected_child_ids: null,
      meta: null,
      purge_report: purgeReport,
    });

    await this.emailProducer.sendAccountPurgedConfirmation({ email, name });
  }

  async permanentlyPurgeParent(parentId: string): Promise<void> {
    const parent = await this.parentRepository.findOne({
      where: { id: parentId },
      relations: ['children', 'children.student'],
    });

    if (!parent || !parent.is_deactivated) {
      return;
    }

    // Cancel child deletion jobs before the transaction — cancelJob is idempotent,
    // and a job that already fired and found a non-deactivated student is a no-op.
    for (const child of parent.children ?? []) {
      if (child.student?.deletion_job_id) {
        await this.accountDeletionProducer.cancelJob(
          child.student.deletion_job_id,
        );
      }
    }

    const purgedStudents: Array<{
      id: string;
      email: string;
      name: string;
      report: PurgeReport;
    }> = [];
    let parentSubsDeIdentified = 0;

    await this.parentRepository.manager.transaction(async (em) => {
      for (const child of parent.children ?? []) {
        if (child.student) {
          const fullStudent = await em.findOne(Student, {
            where: { id: child.student.id },
            relations: [
              'cart',
              'checkouts',
              'tests',
              'organizations',
              'subscribed_courses',
              'subscribed_categories',
            ],
          });
          if (fullStudent) {
            const report = await this.purgeStudentInTx(em, fullStudent);
            purgedStudents.push({
              id: fullStudent.id,
              email: fullStudent.email,
              name: fullStudent.name,
              report,
            });
          }
        }
      }

      // Null TestAssignment.child FK for any orphaned Child rows (no linked student)
      // then null TestAssignment.parent FK before deleting the Parent row.
      const remainingChildren = await em.find(Child, {
        where: { parent: { id: parentId } },
      });
      if (remainingChildren.length) {
        await em
          .createQueryBuilder()
          .update(TestAssignment)
          .set({ child: null })
          .where('"childId" IN (:...ids)', {
            ids: remainingChildren.map((c) => c.id),
          })
          .execute();
      }

      await em
        .createQueryBuilder()
        .update(TestAssignment)
        .set({ parent: null })
        .where('"parentId" = :id', { id: parentId })
        .execute();

      parentSubsDeIdentified = await em.count(ParentSubscription, {
        where: { parent: { id: parentId } },
      });

      // Remove remaining Child rows, then the parent
      await em.delete(Child, { parent: { id: parentId } });
      await em.delete(Parent, parentId);
    });

    const purgedChildIds = purgedStudents.map((s) => s.id);

    const aggregateReport: PurgeReport = {
      profile_deleted: true,
      tests_anonymized: purgedStudents.reduce(
        (sum, s) => sum + s.report.tests_anonymized,
        0,
      ),
      subscriptions_de_identified:
        parentSubsDeIdentified +
        purgedStudents.reduce(
          (sum, s) => sum + s.report.subscriptions_de_identified,
          0,
        ),
      checkouts_deleted: purgedStudents.reduce(
        (sum, s) => sum + s.report.checkouts_deleted,
        0,
      ),
    };

    await this.writeAuditLog({
      event: DeletionAuditEvent.PARENT_ACCOUNT_PURGED,
      account_id: parentId,
      account_type: AuditAccountType.PARENT,
      affected_child_ids: purgedChildIds.length ? purgedChildIds : null,
      meta: null,
      purge_report: aggregateReport,
    });
    await Promise.all(
      purgedStudents.map((s) =>
        this.writeAuditLog({
          event: DeletionAuditEvent.CHILD_CASCADE_PURGED,
          account_id: s.id,
          account_type: AuditAccountType.STUDENT,
          affected_child_ids: null,
          meta: null,
          purge_report: s.report,
        }),
      ),
    );

    await Promise.all(
      purgedStudents.map((s) =>
        this.emailProducer.sendAccountPurgedConfirmation(s),
      ),
    );
  }

  async recordPurgeFailure(job: Job, err: unknown): Promise<void> {
    const isStudent = job.name === 'purge-student-account';
    const accountId = isStudent ? job.data.studentId : job.data.parentId;
    try {
      await this.writeAuditLog({
        event: isStudent
          ? DeletionAuditEvent.STUDENT_PURGE_FAILED
          : DeletionAuditEvent.PARENT_PURGE_FAILED,
        account_id: accountId,
        account_type: isStudent
          ? AuditAccountType.STUDENT
          : AuditAccountType.PARENT,
        affected_child_ids: null,
        meta: null,
      });
      await this.emailProducer.sendPurgeFailureAlert({
        jobId: String(job.id),
        accountId,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    } catch {
      // Best-effort — do not swallow the original error
    }
  }

  // ─── private helpers ─────────────────────────────────────────────────────────

  private async deactivateStudentInTx(
    em: EntityManager,
    student: Student,
  ): Promise<void> {
    student.is_deactivated = true;
    student.deactivated_at = new Date();
    await em.save(student);
  }

  private async reactivateStudentInTx(
    em: EntityManager,
    student: Student,
  ): Promise<void> {
    student.is_deactivated = false;
    student.deactivated_at = null;
    student.deletion_job_id = null;
    await em.save(student);
  }

  private async purgeStudentInTx(
    em: EntityManager,
    student: Student,
  ): Promise<PurgeReport> {
    const studentId = student.id;
    const cartId = student.cart?.id;

    // Clear M:M join tables
    student.organizations = [];
    student.subscribed_courses = [];
    student.subscribed_categories = [];
    await em.save(student);

    // Anonymise test records — strip the student FK (the only direct identifier on Test)
    let tests_anonymized = 0;
    if (student.tests?.length) {
      const result = await em
        .createQueryBuilder()
        .update(Test)
        .set({ student: null })
        .where('studentId = :id', { id: studentId })
        .execute();
      tests_anonymized = result.affected ?? student.tests.length;
    }

    // Count subscriptions that the DB will de-identify via ON DELETE SET NULL cascade
    const subscriptions_de_identified = await em.count(StudentSubscription, {
      where: { student: { id: studentId } },
    });

    // Delete checkouts (purchase-cart records, not financial receipts)
    const checkouts_deleted = student.checkouts?.length ?? 0;
    if (student.checkouts?.length) {
      await em.delete(
        Checkout,
        student.checkouts.map((c) => c.id),
      );
    }

    // Null TestAssignment.child FK before deleting the Child row to avoid FK violation
    const linkedChild = await em.findOne(Child, {
      where: { student: { id: studentId } },
    });
    if (linkedChild) {
      await em
        .createQueryBuilder()
        .update(TestAssignment)
        .set({ child: null })
        .where('"childId" = :id', { id: linkedChild.id })
        .execute();
      await em.delete(Child, linkedChild.id);
    }

    // Delete student row (students.cartId → carts.id FK requires student gone before cart)
    await em.delete(Student, studentId);

    // Delete cart after student row is gone (avoids FK violation on students.cartId)
    if (cartId) {
      await em.delete(Cart, cartId);
    }

    return {
      profile_deleted: true,
      tests_anonymized,
      subscriptions_de_identified,
      checkouts_deleted,
    };
  }

  private daysUntil(date: Date): number {
    return Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  }

  private async writeAuditLog(entry: {
    event: DeletionAuditEvent;
    account_id: string;
    account_type: AuditAccountType;
    affected_child_ids: string[] | null;
    meta: RequestMetadata | null;
    purge_report?: PurgeReport | null;
  }): Promise<void> {
    await this.auditRepository.save(
      this.auditRepository.create({
        event: entry.event,
        account_id: entry.account_id,
        account_type: entry.account_type,
        affected_child_ids: entry.affected_child_ids,
        ip_address: entry.meta?.ip ?? null,
        user_agent: entry.meta?.userAgent ?? null,
        purge_report: entry.purge_report ?? null,
      }),
    );
  }
}
