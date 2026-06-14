import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Cart } from '../../inventory/entities/cart.entity';
import { Organization } from '../entities/organization.entity';
import { Student } from '../entities/student.entity';
import { Child } from '../../parent/entities/child.entity';
import { HashHelper, PaginateHelper } from '../../../helpers';
import { PaginationInput } from '../../../helpers/inputs';
import { StudentLoginResponse } from '../types';
import { AccountStatus } from '../types/account-deletion-response.type';
import { v4 as uuidv4 } from 'uuid';
import { EmailProducer } from './email.producer';
import { SignupProducer } from './signup.producer';
import { LoginBodyDto } from '../dto/login-body.dto';
import { AccountDeletionService } from './account-deletion.service';
import { RequestMetadata } from '../entities/deletion-audit-log.entity';

const FIVE_MIN_MS = 5 * 60 * 1000;
const TTL_30D_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Child)
    private childRepository: Repository<Child>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly emailProducer: EmailProducer,
    private readonly signupProducer: SignupProducer,
    private readonly accountDeletionService: AccountDeletionService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async listOrganizationsPaginated({
    searchTerm,
    pagination,
  }: {
    searchTerm: string;
    pagination?: PaginationInput;
  }) {
    const organizations = await this.listOrganizations({
      searchTerm,
    });

    // Apply pagination and return in the connection format
    return PaginateHelper.paginate<Organization>(
      organizations,
      pagination,
      (organization) => organization.id.toString(),
    );
  }

  async listOrganizations({ searchTerm }: { searchTerm: string }) {
    return this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const organizations = await transactionalEntityManager.find(
          Organization,
          {
            where: {
              name: searchTerm ? ILike(`%${searchTerm.trim()}%`) : undefined,
            },
          },
        );

        return organizations;
      },
    );
  }

  async studentProfile({ email }: { email: string }) {
    const cacheKey = `student-profile:${email}`;
    const cached = await this.cacheManager.get<Student>(cacheKey);
    if (cached) return cached;

    const student = await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const s = await transactionalEntityManager.findOne(Student, {
          where: {
            email,
          },
          relations: ['organizations', 'subscribed_categories'],
        });

        if (!s) {
          throw new NotFoundException('Student does not exist');
        }

        return s;
      },
    );

    await this.cacheManager.set(cacheKey, student, FIVE_MIN_MS);
    return student;
  }

  async registerStudent({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ message: string }> {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const existingStudent = await transactionalEntityManager.findOne(
          Student,
          {
            where: { email },
            relations: ['organizations'],
          },
        );

        if (existingStudent) {
          throw new Error('Student with this email already exists');
        }

        const organization = await transactionalEntityManager.findOne(
          Organization,
          {
            where: { email: this.configService.get('GENPOP_EMAIL') },
          },
        );

        if (!organization) {
          throw new Error('Organization not found');
        }

        const cart = new Cart();

        await transactionalEntityManager.save(Cart, cart);

        const validationCode = Math.floor(
          100000 + Math.random() * 900000,
        ).toString();

        const student = new Student();
        student.name = name;
        student.email = email;
        student.password = await HashHelper.encrypt(password);
        student.cart = cart;
        student.organizations = [organization];
        student.is_account_validated = false;
        student.validation_code = validationCode;

        await transactionalEntityManager.save(Student, student);

        await this.emailProducer.sendAccountValidationEmail({
          email,
          name,
          validationCode,
        });

        return { message: 'Student registered successfully' };
      },
    );
  }

  async loginStudent({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<StudentLoginResponse> {
    // Validate credentials inside transaction, then restore outside to avoid deadlock
    const student = await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: { email },
          relations: ['organizations'],
        });

        if (!student) {
          throw new BadRequestException('Email or password is incorrect');
        }

        const isPasswordValid = await HashHelper.compare(
          password,
          student.password,
        );

        if (!isPasswordValid) {
          throw new BadRequestException('Email or password is incorrect');
        }

        if (!student.is_account_validated) {
          throw new BadRequestException(
            'Account not verified. Please check your email for the verification code.',
          );
        }

        if (student.is_deactivated) {
          const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
          const elapsed =
            Date.now() - new Date(student.deactivated_at).getTime();
          if (elapsed >= NINETY_DAYS_MS) {
            throw new BadRequestException('This account no longer exists.');
          }
        }

        return student;
      },
    );

    if (student.is_deactivated) {
      const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
      const deletionScheduledFor = new Date(
        new Date(student.deactivated_at).getTime() + NINETY_DAYS_MS,
      );
      const pendingToken = this.jwtService.sign(
        {
          id: student.id,
          name: student.name,
          email: student.email,
          role: 'STUDENT',
          type: 'pending_deletion',
        },
        { expiresIn: '15m' },
      );

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await this.cacheManager.set(`cancel_otp:${student.id}`, otp, 10 * 60 * 1000);
      await this.emailProducer.sendCancellationOtpEmail({
        email: student.email,
        name: student.name,
        otp,
      });

      return {
        ...student,
        token: pendingToken,
        account_status: AccountStatus.PENDING_DELETION,
        deletion_scheduled_for: deletionScheduledFor,
      };
    }

    const payload: {
      id: string;
      name: string;
      email: string;
      role: 'STUDENT';
    } = {
      id: student.id,
      name: student.name,
      email: student.email,
      role: 'STUDENT',
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: '30d' },
    );

    return {
      ...student,
      token: access_token,
      refresh_token,
    };
  }

  async verifyCancellationOtp(
    studentId: string,
    otp: string,
  ): Promise<{ message: string }> {
    const stored = await this.cacheManager.get<string>(`cancel_otp:${studentId}`);
    if (!stored || stored !== otp) {
      throw new BadRequestException('Invalid or expired OTP.');
    }
    await this.cacheManager.del(`cancel_otp:${studentId}`);
    await this.cacheManager.set(`cancel_otp_verified:${studentId}`, '1', 10 * 60 * 1000);
    return { message: 'OTP verified. You may now cancel deletion.' };
  }

  async cancelStudentAccountDeletion(
    studentId: string,
    meta?: RequestMetadata,
  ): Promise<StudentLoginResponse> {
    const verified = await this.cacheManager.get(`cancel_otp_verified:${studentId}`);
    if (!verified) {
      throw new UnauthorizedException(
        'Email verification required before cancelling deletion.',
      );
    }
    await this.cacheManager.del(`cancel_otp_verified:${studentId}`);

    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['organizations'],
    });

    if (!student || !student.is_deactivated) {
      throw new UnauthorizedException(
        'No pending deletion found for this account.',
      );
    }

    await this.accountDeletionService.restoreStudent(student, meta ?? null);

    const payload = {
      id: student.id,
      name: student.name,
      email: student.email,
      role: 'STUDENT' as const,
    };

    const token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: '30d' },
    );

    return {
      ...student,
      token,
      refresh_token,
      account_status: AccountStatus.ACTIVE,
    };
  }

  async completeStudentAccountValidation({
    email,
    validation_code,
  }: {
    email: string;
    validation_code: string;
  }): Promise<{ message: string }> {
    return this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: { email },
        });

        if (!student) {
          throw new NotFoundException('Student not found');
        }

        if (student.is_account_validated) {
          return { message: 'Account already verified' };
        }

        if (student.validation_code !== validation_code) {
          throw new BadRequestException('Invalid verification code');
        }

        student.is_account_validated = true;
        student.validation_code = null;
        await transactionalEntityManager.save(Student, student);

        await this.signupProducer.enqueueFreeTrial({ email, role: 'STUDENT' });

        return { message: 'Account verified successfully' };
      },
    );
  }

  async resendAccountValidationCode({
    email,
  }: {
    email: string;
  }): Promise<{ message: string }> {
    return this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: { email },
        });

        if (!student) {
          throw new NotFoundException('Student not found');
        }

        if (student.is_account_validated) {
          throw new BadRequestException('Account is already verified');
        }

        const validationCode = Math.floor(
          100000 + Math.random() * 900000,
        ).toString();

        student.validation_code = validationCode;
        await transactionalEntityManager.save(Student, student);

        await this.emailProducer.sendAccountValidationEmail({
          email,
          name: student.name,
          validationCode,
        });

        return { message: 'Verification code resent successfully' };
      },
    );
  }

  async refreshStudentToken({
    refresh_token,
  }: {
    refresh_token: string;
  }): Promise<{ access_token: string }> {
    let payload: {
      id: string;
      name: string;
      email: string;
      role: 'STUDENT';
      type: string;
    };

    try {
      payload = this.jwtService.verify(refresh_token);
    } catch {
      throw new BadRequestException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new BadRequestException('Invalid token type');
    }

    const isDeactivated = await this.cacheManager.get(`deactivated:${payload.id}`);
    if (isDeactivated) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    const pwChanged = await this.cacheManager.get(`pw_changed:${payload.id}`);
    if (pwChanged) {
      throw new UnauthorizedException('Password was recently changed. Please log in again.');
    }

    const {
      type: _type,
      iat: _iat,
      exp: _exp,
      ...tokenPayload
    } = payload as any;
    const access_token = this.jwtService.sign(tokenPayload);
    return { access_token };
  }

  async requestStudentPasswordReset({ email }: { email: string }) {
    return this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Get Student
        const student = await transactionalEntityManager.findOne(Student, {
          where: { email },
        });

        // If student does not exist, still return success
        if (!student) {
          return { message: 'Password reset link sent to your email' };
        }

        const resetCode = uuidv4();
        student.reset_token = resetCode;
        await transactionalEntityManager.save(student);

        //Send email message into message queue
        await this.emailProducer.sendPasswordResetEmail({
          email,
          name: student.name,
          resetCode,
        });

        return {
          message: 'Password reset link sent to your email',
        };
      },
    );
  }

  async resetStudentPassword({
    email,
    password,
    token,
  }: {
    email: string;
    password: string;
    token: string;
  }) {
    let studentId: string;

    const result = await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Get Student
        const student = await transactionalEntityManager.findOne(Student, {
          where: { email },
        });

        // If student does not exist or reset_token not same, throw an invalid reset error
        if (!student || student.reset_token !== token) {
          throw new BadRequestException('Invalid Password reset details');
        }

        studentId = student.id;

        // Clean things up
        student.reset_token = '';
        student.password = await HashHelper.encrypt(password);

        await transactionalEntityManager.save(student);

        return {
          message: 'Password reset is successful',
        };
      },
    );

    await this.cacheManager.set(`pw_changed:${studentId}`, '1', TTL_30D_MS);
    return result;
  }

  async changePassword({
    email,
    currentPassword,
    newPassword,
  }: {
    email: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    let studentId: string;

    const result = await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: { email },
        });

        if (!student) {
          throw new BadRequestException('Invalid credentials');
        }

        const isValid = await HashHelper.compare(currentPassword, student.password);
        if (!isValid) {
          throw new BadRequestException('Current password is incorrect');
        }

        studentId = student.id;
        student.password = await HashHelper.encrypt(newPassword);
        await transactionalEntityManager.save(student);

        return { message: 'Password changed successfully' };
      },
    );

    await this.cacheManager.set(`pw_changed:${studentId}`, '1', TTL_30D_MS);
    return result;
  }

  async changePin({
    email,
    currentPin,
    newPin,
  }: {
    email: string;
    currentPin: string;
    newPin: string;
  }): Promise<{ message: string }> {
    let studentId: string;

    const result = await this.childRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const child = await transactionalEntityManager.findOne(Child, {
          where: { student: { email } },
          relations: ['student'],
        });

        if (!child) {
          throw new BadRequestException('Child account not found');
        }

        const isValid = await HashHelper.compare(currentPin, child.pin);
        if (!isValid) {
          throw new UnauthorizedException('Current pin is incorrect');
        }

        studentId = child.student.id;
        child.pin = await HashHelper.encrypt(newPin);
        await transactionalEntityManager.save(Child, child);

        return { message: 'Pin changed successfully' };
      },
    );

    await this.cacheManager.set(`pw_changed:${studentId}`, '1', TTL_30D_MS);
    return result;
  }

  async validateGoogleUser(googleUser: LoginBodyDto) {
    const user = await this.studentRepository.findOne({
      where: { email: googleUser.email },
      relations: ['organizations'],
    });

    return user;
  }

  async createGoogleUser({ firstName, lastName, email }) {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const name = firstName + ' ' + lastName;

        // find if student already exist
        const existingUser = await transactionalEntityManager.findOne(Student, {
          where: { email },
        });

        if (existingUser) {
          throw new BadRequestException('Email already exist');
        }

        const organization = await transactionalEntityManager.findOne(
          Organization,
          {
            where: { email: this.configService.get('GENPOP_EMAIL') },
          },
        );

        if (!organization) {
          throw new Error('Organization not found');
        }

        const cart = new Cart();

        await transactionalEntityManager.save(cart);

        const validationCode = Math.floor(
          100000 + Math.random() * 900000,
        ).toString();

        const student = new Student();
        student.name = name;
        student.email = email;
        student.password = await HashHelper.encrypt('password');
        student.cart = cart;
        student.organizations = [organization];
        student.is_account_validated = false;
        student.validation_code = validationCode;

        await transactionalEntityManager.save(student);

        const savedUser = await transactionalEntityManager.save(student);

        await this.emailProducer.sendAccountValidationEmail({
          email,
          name,
          validationCode,
        });

        const payload: {
          id: string;
          organizationId: string;
          name: string;
          email: string;
          role: 'STUDENT';
        } = {
          id: savedUser.id,
          organizationId: organization.id,
          name: savedUser.name,
          email: savedUser.email,
          role: 'STUDENT',
        };

        return payload;
      },
    );
  }
}
