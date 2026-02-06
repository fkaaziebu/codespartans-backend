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

        const student = new Student();
        student.name = name;
        student.email = email;
        student.password = await HashHelper.encrypt(password);
        student.cart = cart;
        student.organizations = [organization];

        await transactionalEntityManager.save(Student, student);

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

        return {
          ...student,
          token: access_token,
        };
      },
    );
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

        const student = new Student();
        student.name = name;
        student.email = email;
        student.password = await HashHelper.encrypt('password');
        student.cart = cart;
        student.organizations = [organization];

        await transactionalEntityManager.save(student);

        const savedUser = await transactionalEntityManager.save(student);

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
