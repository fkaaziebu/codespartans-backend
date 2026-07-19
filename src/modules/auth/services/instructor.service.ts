import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instructor } from '../entities/instructor.entity';
import { Organization } from '../entities/organization.entity';
import { HashHelper } from '../../../helpers';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';
import { InstructorLoginResponse } from '../types';

@Injectable()
export class InstructorService {
  private readonly log = this.loggerRegistry.getLogger('auth');

  constructor(
    @InjectRepository(Instructor)
    private instructorRepository: Repository<Instructor>,
    private jwtService: JwtService,
    private readonly loggerRegistry: ModuleLoggerRegistry,
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
          role: 'INSTRUCTOR';
        } = {
          id: instructor.id,
          role: 'INSTRUCTOR',
        };

        const access_token = this.jwtService.sign(payload);

        this.log.info(
          { instructorId: instructor.id },
          'auth.instructor.login.success',
        );

        return {
          ...instructor,
          token: access_token,
        };
      },
    );
  }
}
