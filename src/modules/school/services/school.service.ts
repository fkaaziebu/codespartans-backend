import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { HashHelper, PaginateHelper } from '../../../helpers';
import { PaginationInput } from '../../../helpers/inputs';
import { Organization } from '../../auth/entities/organization.entity';
import { Student } from '../../auth/entities/student.entity';
import { Cart } from '../../inventory/entities/cart.entity';
import { Category } from '../../inventory/entities/category.entity';
import { ILike, Repository } from 'typeorm';
import { SchoolStudent } from '../entities/school-student.entity';
import { AddSchoolStudentInput } from '../inputs/add-school-student.input';
import {
  EnrollStudentResult,
  LoginSchoolStudentResponse,
} from '../types';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(SchoolStudent)
    private readonly schoolStudentRepo: Repository<SchoolStudent>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async addSchoolStudent(
    orgEmail: string,
    input: AddSchoolStudentInput,
  ): Promise<{ message: string; pin: string }> {
    return this.orgRepo.manager.transaction(async (em) => {
      const org = await em.findOne(Organization, {
        where: { email: orgEmail },
      });

      if (!org) throw new NotFoundException('Organization not found');

      const category = await em.findOne(Category, {
        where: { id: input.target_exam },
        relations: ['courses'],
      });

      if (!category) {
        throw new NotFoundException(
          `Exam category with id ${input.target_exam} not found`,
        );
      }

      const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
      const username = await this.generateUniqueUsername(input.full_name, em);

      const cart = em.create(Cart, {});
      await em.save(Cart, cart);

      const student = em.create(Student, {
        name: input.full_name,
        email: `${username}@student.local`,
        password: await HashHelper.encrypt(rawPin),
        is_account_validated: true,
        is_setup_completed: true,
        cart,
        organizations: [org],
        subscribed_categories: [category],
        subscribed_courses: category.courses ?? [],
      });

      await em.save(Student, student);

      const schoolStudent = em.create(SchoolStudent, {
        full_name: input.full_name,
        class_level: input.class_level,
        target_exam: input.target_exam,
        username,
        pin: await HashHelper.encrypt(rawPin),
        organization: org,
        student,
      });

      await em.save(SchoolStudent, schoolStudent);

      return { message: 'Student enrolled successfully', pin: rawPin };
    });
  }

  async bulkEnrollStudents(
    orgEmail: string,
    students: AddSchoolStudentInput[],
  ): Promise<EnrollStudentResult[]> {
    return this.orgRepo.manager.transaction(async (em) => {
      const org = await em.findOne(Organization, {
        where: { email: orgEmail },
      });

      if (!org) throw new NotFoundException('Organization not found');

      const results: EnrollStudentResult[] = [];

      for (const input of students) {
        const category = await em.findOne(Category, {
          where: { id: input.target_exam },
          relations: ['courses'],
        });

        if (!category) {
          throw new NotFoundException(
            `Exam category with id ${input.target_exam} not found`,
          );
        }

        const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
        const username = await this.generateUniqueUsername(input.full_name, em);

        const cart = em.create(Cart, {});
        await em.save(Cart, cart);

        const student = em.create(Student, {
          name: input.full_name,
          email: `${username}@student.local`,
          password: await HashHelper.encrypt(rawPin),
          is_account_validated: true,
          is_setup_completed: true,
          cart,
          organizations: [org],
          subscribed_categories: [category],
          subscribed_courses: category.courses ?? [],
        });

        await em.save(Student, student);

        const schoolStudent = em.create(SchoolStudent, {
          full_name: input.full_name,
          class_level: input.class_level,
          target_exam: input.target_exam,
          username,
          pin: await HashHelper.encrypt(rawPin),
          organization: org,
          student,
        });

        await em.save(SchoolStudent, schoolStudent);

        results.push({ full_name: input.full_name, username, pin: rawPin });
      }

      return results;
    });
  }

  async resetStudentPin(
    orgEmail: string,
    studentId: string,
  ): Promise<{ message: string; pin: string }> {
    return this.orgRepo.manager.transaction(async (em) => {
      const schoolStudent = await em.findOne(SchoolStudent, {
        where: { id: studentId, organization: { email: orgEmail } },
        relations: ['student'],
      });

      if (!schoolStudent) {
        throw new NotFoundException('Student not found');
      }

      const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
      const hashed = await HashHelper.encrypt(rawPin);

      schoolStudent.pin = hashed;
      await em.save(SchoolStudent, schoolStudent);

      if (schoolStudent.student) {
        schoolStudent.student.password = hashed;
        await em.save(Student, schoolStudent.student);
      }

      return { message: 'PIN reset successfully', pin: rawPin };
    });
  }

  async shareStudentLogin(
    orgEmail: string,
    studentId: string,
  ): Promise<{ message: string }> {
    return this.orgRepo.manager.transaction(async (em) => {
      const schoolStudent = await em.findOne(SchoolStudent, {
        where: { id: studentId, organization: { email: orgEmail } },
        relations: ['student'],
      });

      if (!schoolStudent) {
        throw new NotFoundException('Student not found');
      }

      const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
      const hashed = await HashHelper.encrypt(rawPin);

      schoolStudent.pin = hashed;
      await em.save(SchoolStudent, schoolStudent);

      if (schoolStudent.student) {
        schoolStudent.student.password = hashed;
        await em.save(Student, schoolStudent.student);
      }

      const studentUrl = this.configService.get<string>(
        'STUDENT_URL',
        'http://localhost:3000',
      );

      const message =
        `Here are ${schoolStudent.full_name}'s login details — ` +
        `Username: ${schoolStudent.username} | PIN: ${rawPin} | ` +
        `Login at: ${studentUrl}/student-login`;

      return { message };
    });
  }

  async listSchoolStudents(
    orgEmail: string,
    searchTerm?: string,
    pagination?: PaginationInput,
  ) {
    const org = await this.orgRepo.findOne({ where: { email: orgEmail } });

    if (!org) throw new NotFoundException('Organization not found');

    const students = await this.schoolStudentRepo.find({
      where: {
        organization: { id: org.id },
        ...(searchTerm
          ? { full_name: ILike(`%${searchTerm.trim()}%`) }
          : {}),
      },
      relations: ['student'],
      order: { full_name: 'ASC' },
    });

    return PaginateHelper.paginate<SchoolStudent>(
      students,
      pagination,
      (s) => s.id,
    );
  }

  async removeSchoolStudent(
    orgEmail: string,
    studentId: string,
  ): Promise<{ message: string }> {
    return this.orgRepo.manager.transaction(async (em) => {
      const schoolStudent = await em.findOne(SchoolStudent, {
        where: { id: studentId, organization: { email: orgEmail } },
        relations: ['student'],
      });

      if (!schoolStudent) {
        throw new NotFoundException('Student not found');
      }

      if (schoolStudent.student) {
        // Remove org link from the underlying Student record
        const student = await em.findOne(Student, {
          where: { id: schoolStudent.student.id },
          relations: ['organizations'],
        });

        if (student) {
          student.organizations = student.organizations.filter(
            (o) => o.email !== orgEmail,
          );
          await em.save(Student, student);
        }
      }

      await em.remove(SchoolStudent, schoolStudent);

      return { message: 'Student removed from school successfully' };
    });
  }

  async verifyStudentUsername(
    username: string,
  ): Promise<{ temp_token: string }> {
    const schoolStudent = await this.schoolStudentRepo.findOne({
      where: { username },
    });

    if (!schoolStudent) {
      throw new NotFoundException('Username not found');
    }

    const payload = {
      id: schoolStudent.id,
      username: schoolStudent.username,
      role: 'SCHOOL_STUDENT' as const,
      type: 'temp',
    };

    const temp_token = this.jwtService.sign(payload, { expiresIn: '5m' });

    return { temp_token };
  }

  async loginSchoolStudent(
    temp_token: string,
    pin: string,
  ): Promise<LoginSchoolStudentResponse> {
    let payload: {
      id: string;
      username: string;
      role: string;
      type: string;
    };

    try {
      payload = this.jwtService.verify(temp_token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.type !== 'temp' || payload.role !== 'SCHOOL_STUDENT') {
      throw new UnauthorizedException('Invalid token type');
    }

    const schoolStudent = await this.schoolStudentRepo.findOne({
      where: { id: payload.id },
      relations: ['student', 'student.organizations'],
    });

    if (!schoolStudent) {
      throw new NotFoundException('Student not found');
    }

    const isPinValid = await HashHelper.compare(pin, schoolStudent.pin);

    if (!isPinValid) {
      throw new BadRequestException('Invalid PIN');
    }

    const tokenPayload = {
      id: schoolStudent.student.id,
      name: schoolStudent.student.name,
      email: schoolStudent.student.email,
      role: 'STUDENT' as const,
    };

    const token = this.jwtService.sign(tokenPayload);
    const refresh_token = this.jwtService.sign(
      { ...tokenPayload, type: 'refresh' },
      { expiresIn: '30d' },
    );

    return { ...schoolStudent, token, refresh_token };
  }

  private async generateUniqueUsername(
    full_name: string,
    entityManager: any,
  ): Promise<string> {
    const parts = full_name.trim().toLowerCase().split(/\s+/);
    const base =
      parts.length >= 2 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0];

    let username: string;
    let exists = true;

    while (exists) {
      const suffix = Math.floor(10 + Math.random() * 90).toString();
      username = `${base}${suffix}`;
      const found = await entityManager.findOne(SchoolStudent, {
        where: { username },
      });
      exists = !!found;
    }

    return username;
  }
}
