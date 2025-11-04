import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instructor, Organization } from '../../../database/entities';
import { HashHelper } from '../../../helpers';
import { InstructorLoginResponse } from '../types';

@Injectable()
export class InstructorService {
  constructor(
    @InjectRepository(Instructor)
    private instructorRepository: Repository<Instructor>,
    private jwtService: JwtService,
  ) {}

  async loginInstructor({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<InstructorLoginResponse> {
    return await this.instructorRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const instructor = await transactionalEntityManager.findOne(
          Instructor,
          {
            where: { email },
            relations: ['organizations'],
          },
        );

        if (!instructor) {
          throw new BadRequestException('Email or password is incorrect');
        }

        const isPasswordValid = await HashHelper.compare(
          password,
          instructor.password,
        );

        if (!isPasswordValid) {
          throw new BadRequestException('Email or password is incorrect');
        }

        const payload: {
          id: string;
          name: string;
          email: string;
          role: 'INSTRUCTOR';
        } = {
          id: instructor.id,
          name: instructor.name,
          email: instructor.email,
          role: 'INSTRUCTOR',
        };

        const access_token = this.jwtService.sign(payload);

        return {
          ...instructor,
          token: access_token,
        };
      },
    );
  }
}
