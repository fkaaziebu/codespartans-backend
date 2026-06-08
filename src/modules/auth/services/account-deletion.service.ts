import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Student } from '../entities/student.entity';
import { Parent } from '../../parent/entities/parent.entity';
import { Child } from '../../parent/entities/child.entity';
import { Cart } from '../../inventory/entities/cart.entity';
import { Checkout } from '../../inventory/entities/checkout.entity';
import { Test } from '../../simulation/entities/test.entity';
import { AccountDeletionProducer } from './account-deletion.producer';
import { EmailProducer } from './email.producer';

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

@Injectable()
export class AccountDeletionService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,
    @InjectRepository(Child)
    private childRepository: Repository<Child>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(Checkout)
    private checkoutRepository: Repository<Checkout>,
    @InjectRepository(Test)
    private testRepository: Repository<Test>,
    private readonly accountDeletionProducer: AccountDeletionProducer,
    private readonly emailProducer: EmailProducer,
  ) {}

  // ─── public API ──────────────────────────────────────────────────────────────

  async requestStudentAccountDeletion(
    studentId: string,
  ): Promise<{ message: string }> {
    return this.studentRepository.manager.transaction(async (em) => {
      const student = await em.findOne(Student, { where: { id: studentId } });

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
        throw new BadRequestException('Account deletion already requested');
      }

      await this.deactivateStudentInTx(em, student);

      return {
        message:
          'Account deletion requested. Your account will be permanently deleted in 90 days. Log in any time within 90 days to cancel.',
      };
    });
  }

  async requestParentAccountDeletion(
    parentId: string,
  ): Promise<{ message: string }> {
    return this.parentRepository.manager.transaction(async (em) => {
      const parent = await em.findOne(Parent, {
        where: { id: parentId },
        relations: ['children', 'children.student'],
      });

      if (!parent) {
        throw new NotFoundException('Parent not found');
      }

      if (parent.is_deactivated) {
        throw new BadRequestException('Account deletion already requested');
      }

      for (const child of parent.children ?? []) {
        if (child.student && !child.student.is_deactivated) {
          await this.deactivateStudentInTx(em, child.student);
        }
      }

      parent.is_deactivated = true;
      parent.deactivated_at = new Date();
      await em.save(parent);

      const jobId =
        await this.accountDeletionProducer.scheduleParentPurge(parentId);
      parent.deletion_job_id = jobId;
      await em.save(parent);

      const gracePeriodEnd = new Date(
        parent.deactivated_at.getTime() + NINETY_DAYS_MS,
      ).toDateString();

      await this.emailProducer.sendAccountDeletionNotice({
        email: parent.email,
        name: `${parent.first_name} ${parent.last_name}`,
        gracePeriodEnd,
      });

      return {
        message:
          'Account deletion requested. Your account will be permanently deleted in 90 days. Log in any time within 90 days to cancel.',
      };
    });
  }

  async deleteChild(
    parentEmail: string,
    childId: string,
  ): Promise<{ message: string }> {
    return this.childRepository.manager.transaction(async (em) => {
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

      if (child.student && !child.student.is_deactivated) {
        await this.deactivateStudentInTx(em, child.student);
      }

      child.student = null;
      await em.save(child);

      return { message: 'Child account deletion requested.' };
    });
  }

  async restoreStudent(student: Student): Promise<void> {
    if (student.deletion_job_id) {
      await this.accountDeletionProducer.cancelJob(student.deletion_job_id);
    }

    student.is_deactivated = false;
    student.deactivated_at = null;
    student.deletion_job_id = null;
    await this.studentRepository.save(student);

    await this.emailProducer.sendAccountRestoredNotice({
      email: student.email,
      name: student.name,
    });
  }

  async restoreParent(parent: Parent): Promise<void> {
    if (parent.deletion_job_id) {
      await this.accountDeletionProducer.cancelJob(parent.deletion_job_id);
    }

    parent.is_deactivated = false;
    parent.deactivated_at = null;
    parent.deletion_job_id = null;
    await this.parentRepository.save(parent);

    await this.emailProducer.sendAccountRestoredNotice({
      email: parent.email,
      name: `${parent.first_name} ${parent.last_name}`,
    });
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

    const cartId = student.cart?.id;

    await this.studentRepository.manager.transaction(async (em) => {
      // Clear M:M join tables
      student.organizations = [];
      student.subscribed_courses = [];
      student.subscribed_categories = [];
      await em.save(student);

      // Nullify student FK on tests (academic data anonymisation)
      if (student.tests?.length) {
        await em
          .createQueryBuilder()
          .update(Test)
          .set({ student: null })
          .where('studentId = :id', { id: studentId })
          .execute();
      }

      // Delete checkouts by primary key
      if (student.checkouts?.length) {
        await em.delete(
          Checkout,
          student.checkouts.map((c) => c.id),
        );
      }

      // Delete linked Child record before student (children.studentId FK)
      const linkedChild = await em.findOne(Child, {
        where: { student: { id: studentId } },
      });
      if (linkedChild) {
        await em.delete(Child, linkedChild.id);
      }

      // Delete student row (students.cartId → carts.id FK requires student gone before cart)
      await em.delete(Student, studentId);

      // Delete cart after student row is gone (avoids FK violation on students.cartId)
      if (cartId) {
        await em.delete(Cart, cartId);
      }
    });

    await this.emailProducer.sendAccountPurgedConfirmation({ email, name });
  }

  async permanentlyPurgeParent(parentId: string): Promise<void> {
    const parent = await this.parentRepository.findOne({
      where: { id: parentId },
      relations: ['children', 'children.student'],
    });

    if (!parent) {
      return;
    }

    for (const child of parent.children ?? []) {
      if (child.student) {
        await this.permanentlyPurgeStudent(child.student.id);
      }
    }

    await this.parentRepository.manager.transaction(async (em) => {
      await em.delete(Child, { parent: { id: parentId } });
      await em.delete(Parent, parentId);
    });
  }

  // ─── private helpers ─────────────────────────────────────────────────────────

  private async deactivateStudentInTx(
    em: EntityManager,
    student: Student,
  ): Promise<void> {
    student.is_deactivated = true;
    student.deactivated_at = new Date();
    await em.save(student);

    const jobId = await this.accountDeletionProducer.scheduleStudentPurge(
      student.id,
    );
    student.deletion_job_id = jobId;
    await em.save(student);

    const gracePeriodEnd = new Date(
      student.deactivated_at.getTime() + NINETY_DAYS_MS,
    ).toDateString();

    await this.emailProducer.sendAccountDeletionNotice({
      email: student.email,
      name: student.name,
      gracePeriodEnd,
    });
  }
}
