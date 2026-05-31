import { Admin } from '../modules/auth/entities/admin.entity';
import { Instructor } from '../modules/auth/entities/instructor.entity';
import { Organization } from '../modules/auth/entities/organization.entity';
import { Student } from '../modules/auth/entities/student.entity';
import { Cart } from '../modules/inventory/entities/cart.entity';
import { Category } from '../modules/inventory/entities/category.entity';
import { Checkout } from '../modules/inventory/entities/checkout.entity';
import { Coupon } from '../modules/inventory/entities/coupon.entity';
import { Course } from '../modules/inventory/entities/course.entity';
import { Issue } from '../modules/review/entities/issue.entity';
import { Question } from '../modules/review/entities/question.entity';
import { Review } from '../modules/review/entities/review.entity';
import { ReviewRequest } from '../modules/review/entities/review_request.entity';
import { TestSuite } from '../modules/review/entities/test_suite.entity';
import { Version } from '../modules/review/entities/version.entity';
import { Recommendation } from '../modules/simulation/entities/recommendation.entity';
import { SubmittedAnswer } from '../modules/simulation/entities/sumitted_answer.entity';
import { Test } from '../modules/simulation/entities/test.entity';
import { TestAssignment } from '../modules/simulation/entities/test_assignment.entity';
import { TimeEvent } from '../modules/simulation/entities/time_event.entity';
import { Image } from '../modules/media/entities/image.entity';
import { Child } from '../modules/parent/entities/child.entity';
import { Parent } from '../modules/parent/entities/parent.entity';
import { ParentSubscription } from '../modules/parent/entities/parent-subscription.entity';
import { OrgSubscription } from '../modules/demo/entities/organization-subscription.entity';
import { ParentDemoRequest } from '../modules/demo/entities/parent-demo-request.entity';
import { SchoolDemo } from '../modules/demo/entities/school-demo.entity';
import { StudentDemoRequest } from '../modules/demo/entities/student-demo-request.entity';
import { StudentSubscription } from '../modules/demo/entities/student-subscription.entity';
import { SubscriptionPlan } from '../modules/demo/entities/subscription-plan.entity';
import { SchoolStudent } from '../modules/school/entities/school-student.entity';

export const entities = [
  Admin,
  Cart,
  Category,
  Checkout,
  Child,
  Coupon,
  Course,
  Image,
  Instructor,
  Issue,
  OrgSubscription,
  Organization,
  Parent,
  ParentDemoRequest,
  ParentSubscription,
  Question,
  Recommendation,
  Review,
  ReviewRequest,
  SchoolDemo,
  SchoolStudent,
  Student,
  StudentDemoRequest,
  StudentSubscription,
  SubmittedAnswer,
  SubscriptionPlan,
  Test,
  TestAssignment,
  TestSuite,
  TimeEvent,
  Version,
];

export {
  Admin,
  Cart,
  Category,
  Checkout,
  Child,
  Coupon,
  Course,
  Image,
  Instructor,
  Issue,
  OrgSubscription,
  Organization,
  Parent,
  ParentDemoRequest,
  ParentSubscription,
  Question,
  Recommendation,
  Review,
  ReviewRequest,
  SchoolDemo,
  SchoolStudent,
  Student,
  StudentDemoRequest,
  StudentSubscription,
  SubmittedAnswer,
  SubscriptionPlan,
  Test,
  TestAssignment,
  TestSuite,
  TimeEvent,
  Version,
};
