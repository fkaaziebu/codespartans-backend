import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminTypeClass, InstructorTypeClass } from 'src/database/types';
import { Repository } from 'typeorm';
import { Admin, Instructor, Organization } from '../../../database/entities';
import { HashHelper } from '../../../helpers';
import { OrganizationLoginResponse } from '../types';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private jwtService: JwtService,
  ) {}

  async registerOrganization({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ message: string }> {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const existingOrganization = await transactionalEntityManager.findOne(
          Organization,
          {
            where: { email },
          },
        );

        if (existingOrganization) {
          throw new Error('Organization with this email already exists');
        }

        const organization = new Organization();
        organization.name = name;
        organization.email = email;
        organization.password = await HashHelper.encrypt(password);

        await transactionalEntityManager.save(Organization, organization);

        return { message: 'Organization registered successfully' };
      },
    );
  }

  async registerAdmin({
    organizationEmail,
    name,
    email,
    password,
  }: {
    organizationEmail: string;
    name: string;
    email: string;
    password: string;
  }): Promise<AdminTypeClass> {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const organization = await transactionalEntityManager.findOne(
          Organization,
          {
            where: {
              email: organizationEmail,
            },
          },
        );

        if (!organization) {
          throw new NotFoundException('Organization not found');
        }

        const existingAdmin = await transactionalEntityManager.findOne(Admin, {
          where: { email },
        });

        if (existingAdmin) {
          throw new Error('Admin with this email already exists');
        }

        const admin = new Admin();
        admin.name = name;
        admin.email = email;
        admin.password = await HashHelper.encrypt(password);
        admin.organization = organization;

        return await transactionalEntityManager.save(Admin, admin);
      },
    );
  }

  async registerInstructor({
    organizationEmail,
    name,
    email,
    password,
  }: {
    organizationEmail: string;
    name: string;
    email: string;
    password: string;
  }): Promise<InstructorTypeClass> {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const organization = await transactionalEntityManager.findOne(
          Organization,
          {
            where: {
              email: organizationEmail,
            },
          },
        );

        if (!organization) {
          throw new NotFoundException('Organization not found');
        }

        const existingInstructor = await transactionalEntityManager.findOne(
          Instructor,
          {
            where: { email },
          },
        );

        if (existingInstructor) {
          throw new BadRequestException(
            'Instructor with this email already exists',
          );
        }

        const instructor = new Instructor();
        instructor.name = name;
        instructor.email = email;
        instructor.password = await HashHelper.encrypt(password);
        instructor.organizations = [organization];

        return await transactionalEntityManager.save(Instructor, instructor);
      },
    );
  }

  async loginOrganization({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<OrganizationLoginResponse> {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const organization = await transactionalEntityManager.findOne(
          Organization,
          {
            where: { email },
          },
        );

        if (!organization) {
          throw new BadRequestException('Email or password is incorrect');
        }

        const isPasswordValid = await HashHelper.compare(
          password,
          organization.password,
        );

        if (!isPasswordValid) {
          throw new BadRequestException('Email or password is incorrect');
        }

        const payload: {
          id: string;
          name: string;
          email: string;
          role: 'ORGANIZATION';
        } = {
          id: organization.id,
          name: organization.name,
          email: organization.email,
          role: 'ORGANIZATION',
        };

        const access_token = this.jwtService.sign(payload);

        return {
          ...organization,
          token: access_token,
        };
      },
    );
  }
}
