import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Cart, Organization, Student } from '../../../database/entities';
import { HashHelper, PaginateHelper } from '../../../helpers';
import { PaginationInput } from '../../../helpers/inputs';
import { StudentLoginResponse } from '../types';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    private jwtService: JwtService,
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

  async registerStudent({
    name,
    email,
    password,
    organizationId,
  }: {
    name: string;
    email: string;
    password: string;
    organizationId: string;
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
            where: { id: organizationId },
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
}
