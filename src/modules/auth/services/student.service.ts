import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Cart, Organization, Student } from '../../../database/entities';
import { HashHelper, PaginateHelper } from '../../../helpers';
import { PaginationInput } from '../../../helpers/inputs';
import { StudentLoginResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { EmailProducer } from './email.producer';
import { LoginBodyDto } from '../dto/login-body.dto';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly emailProducer: EmailProducer,
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
    return this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: {
            email,
          },
        });

        if (!student) {
          throw new NotFoundException('Student does not exist');
        }

        return student;
      },
    );
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
    return await this.studentRepository.manager.transaction(
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
      },
    );
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

    const { type: _type, ...tokenPayload } = payload;
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
    return this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Get Student
        const student = await transactionalEntityManager.findOne(Student, {
          where: { email },
        });

        // If student does not exist or reset_token not same, throw an invalid reset error
        if (!student || student.reset_token !== token) {
          throw new BadRequestException('Invalid Password reset details');
        }

        // Clean things up
        student.reset_token = '';
        student.password = await HashHelper.encrypt(password);

        await transactionalEntityManager.save(student);

        return {
          message: 'Password reset is successful',
        };
      },
    );
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
