import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin, Organization } from '../../../database/entities';
import { HashHelper } from '../../../helpers';
import { AdminLoginResponse } from '../types';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
  ) {}

  async loginAdmin({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<AdminLoginResponse> {
    return await this.adminRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const admin = await transactionalEntityManager.findOne(Admin, {
          where: { email },
        });

        if (!admin) {
          throw new BadRequestException('Email or password is incorrect');
        }

        const isPasswordValid = await HashHelper.compare(
          password,
          admin.password,
        );

        if (!isPasswordValid) {
          throw new BadRequestException('Email or password is incorrect');
        }

        const payload: {
          id: string;
          name: string;
          email: string;
          role: 'ADMIN';
        } = {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: 'ADMIN',
        };

        const access_token = this.jwtService.sign(payload);

        return {
          ...admin,
          token: access_token,
        };
      },
    );
  }
}
