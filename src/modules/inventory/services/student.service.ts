import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CartTypeClass, CheckoutTypeClass } from 'src/database/types';
import { PaginateHelper } from 'src/helpers';
import { PaginationInput } from 'src/helpers/inputs';
import { ILike, Repository } from 'typeorm';
import {
  Category,
  Checkout,
  Course,
  Student,
} from '../../../database/entities';
// import { CourseTypeClass } from 'src/database/types';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
  ) {}

  async getOrganizationCourse({
    email,
    courseId,
  }: {
    email: string;
    courseId: string;
  }): Promise<Course> {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const course = await transactionalEntityManager.findOne(Course, {
          where: {
            id: courseId,
            organization: {
              students: {
                email,
              },
            },
          },
          relations: [
            'approved_version.questions',
            'approved_version.assigned_admin',
            'versions.questions',
            'versions.assigned_admin',
          ],
        });

        return course;
      },
    );
  }

  async listOrganizationCoursesPaginated({
    email,
    organizationId,
    searchTerm,
    pagination,
  }: {
    email: string;
    organizationId: string;
    searchTerm?: string;
    pagination?: PaginationInput;
  }) {
    const courses = await this.listOrganizationCourses({
      email,
      organizationId,
      searchTerm,
    });

    // Apply pagination and return in the connection format
    return PaginateHelper.paginate<Course>(courses, pagination, (course) =>
      course.id.toString(),
    );
  }

  async listOrganizationCourses({
    email,
    organizationId,
    searchTerm,
  }: {
    email: string;
    organizationId: string;
    searchTerm?: string;
  }): Promise<Course[]> {
    const student = await this.studentRepository.findOne({
      where: {
        email,
      },
      relations: ['subscribed_courses'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const courses = await this.courseRepository.find({
      where: {
        organization: {
          id: organizationId,
          students: {
            email,
          },
        },
        title: searchTerm ? ILike(`%${searchTerm.trim()}%`) : undefined,
      },
      relations: ['instructor', 'approved_version.questions'],
    });

    return courses
      .filter((course) => course.approved_version)
      .map((course) => ({
        ...course,
        is_subscribed: Boolean(
          student.subscribed_courses.find((crs) => crs.id === course.id),
        ),
        total_questions: course.approved_version.questions.length,
        estimated_duration: course.approved_version.questions.reduce(
          (acc, question) => acc + question.estimated_time_in_ms,
          0,
        ),
      }));
  }

  async addCourseToCart({
    email,
    courseId,
  }: {
    email: string;
    courseId: string;
  }): Promise<CartTypeClass> {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: { email },
          relations: ['cart.courses'],
        });

        if (!student) {
          throw new Error('Student not found');
        }

        const course = await transactionalEntityManager.findOne(Course, {
          where: {
            id: courseId,
            organization: {
              students: {
                email,
              },
            },
          },
        });

        if (!course) {
          throw new Error('Course not found');
        }

        student.cart.courses.push(course);

        return await transactionalEntityManager.save(student.cart);
      },
    );
  }

  async addCategoryToCart({
    email,
    categoryId,
  }: {
    email: string;
    categoryId: string;
  }): Promise<CartTypeClass> {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: { email },
          relations: ['cart.categories'],
        });

        if (!student) {
          throw new Error('Student not found');
        }

        const category = await transactionalEntityManager.findOne(Category, {
          where: {
            id: categoryId,
            organization: {
              students: {
                email,
              },
            },
          },
          relations: ['courses'],
        });

        if (!category) {
          throw new Error('Category not found');
        }

        student.cart.categories.push(category);

        return await transactionalEntityManager.save(student.cart);
      },
    );
  }

  async createCheckout({
    email,
    courseId,
    checkoutFromCart,
    autoApproveSubscription,
  }: {
    email: string;
    courseId?: string;
    checkoutFromCart?: boolean;
    autoApproveSubscription: boolean;
  }): Promise<CheckoutTypeClass> {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: { email },
          relations: [
            'cart.courses',
            'cart.categories.courses',
            'subscribed_courses',
            'subscribed_categories',
          ],
        });

        if (!student) {
          throw new Error('Student not found');
        }

        let courseToSubscribeTo: Course[] = [];
        const categories = student.cart.categories;

        if (checkoutFromCart && courseId) {
          if (student.cart.courses.some((c) => c.id === courseId)) {
            courseToSubscribeTo.push(
              ...student.cart.courses,
              ...student.cart.categories
                .map((category) => category.courses)
                .flat()
                .filter(
                  (course) =>
                    !student.subscribed_courses
                      .map((crs) => crs.id)
                      .includes(course.id),
                ),
            );

            courseToSubscribeTo = [
              ...new Map(
                courseToSubscribeTo.map((course) => [course.id, course]),
              ).values(),
            ];
          } else {
            const course = await transactionalEntityManager.findOne(Course, {
              where: {
                id: courseId,
                organization: {
                  students: {
                    email,
                  },
                },
              },
            });

            if (!course) {
              throw new Error('Course not found');
            }

            courseToSubscribeTo.push(
              ...student.cart.courses,
              ...student.cart.categories
                .map((category) => category.courses)
                .flat()
                .filter(
                  (course) =>
                    !student.subscribed_courses
                      .map((crs) => crs.id)
                      .includes(course.id),
                ),
              course,
            );

            courseToSubscribeTo = [
              ...new Map(
                courseToSubscribeTo.map((course) => [course.id, course]),
              ).values(),
            ];
          }

          student.cart.courses = [];
          student.cart.categories = [];
        } else if (checkoutFromCart) {
          courseToSubscribeTo.push(
            ...student.cart.courses,
            ...student.cart.categories
              .map((category) => category.courses)
              .map((courses) => courses)
              .flat()
              .filter(
                (course) =>
                  !student.subscribed_courses
                    .map((crs) => crs.id)
                    .includes(course.id),
              ),
          );
          courseToSubscribeTo = [
            ...new Map(
              courseToSubscribeTo.map((course) => [course.id, course]),
            ).values(),
          ];

          student.cart.courses = [];
          student.cart.categories = [];
        } else if (courseId) {
          const course = await transactionalEntityManager.findOne(Course, {
            where: {
              id: courseId,
              organization: {
                students: {
                  email,
                },
              },
            },
          });

          if (!course) {
            throw new Error('Course not found');
          }

          courseToSubscribeTo.push(course);
          student.cart.courses = student.cart.courses.filter(
            (course) => course.id !== courseId,
          );
        } else {
          throw new Error(
            'Invalid checkout, you must either checkout from cart or provide a course ID',
          );
        }

        if (autoApproveSubscription) {
          student.subscribed_courses.push(...courseToSubscribeTo);
          student.subscribed_categories.push(...categories);
          await transactionalEntityManager.save(student);
        }

        await transactionalEntityManager.save(student.cart);

        const checkout = new Checkout();
        checkout.student = student;
        checkout.courses = courseToSubscribeTo;
        checkout.categories = categories;
        return await transactionalEntityManager.save(checkout);
      },
    );
  }
}
