"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Version = exports.TimeEvent = exports.TestSuite = exports.TestAssignment = exports.Test = exports.SubscriptionPlan = exports.SubmittedAnswer = exports.StudentSubscription = exports.StudentDemoRequest = exports.Student = exports.SchoolStudent = exports.SchoolDemo = exports.ReviewRequest = exports.Review = exports.Recommendation = exports.Question = exports.ParentSubscription = exports.ParentDemoRequest = exports.Parent = exports.Organization = exports.OrgSubscription = exports.Issue = exports.Instructor = exports.Image = exports.Course = exports.Coupon = exports.Child = exports.Checkout = exports.Category = exports.Cart = exports.Admin = exports.entities = void 0;
const admin_entity_1 = require("../modules/auth/entities/admin.entity");
Object.defineProperty(exports, "Admin", { enumerable: true, get: function () { return admin_entity_1.Admin; } });
const instructor_entity_1 = require("../modules/auth/entities/instructor.entity");
Object.defineProperty(exports, "Instructor", { enumerable: true, get: function () { return instructor_entity_1.Instructor; } });
const organization_entity_1 = require("../modules/auth/entities/organization.entity");
Object.defineProperty(exports, "Organization", { enumerable: true, get: function () { return organization_entity_1.Organization; } });
const student_entity_1 = require("../modules/auth/entities/student.entity");
Object.defineProperty(exports, "Student", { enumerable: true, get: function () { return student_entity_1.Student; } });
const cart_entity_1 = require("../modules/inventory/entities/cart.entity");
Object.defineProperty(exports, "Cart", { enumerable: true, get: function () { return cart_entity_1.Cart; } });
const category_entity_1 = require("../modules/inventory/entities/category.entity");
Object.defineProperty(exports, "Category", { enumerable: true, get: function () { return category_entity_1.Category; } });
const checkout_entity_1 = require("../modules/inventory/entities/checkout.entity");
Object.defineProperty(exports, "Checkout", { enumerable: true, get: function () { return checkout_entity_1.Checkout; } });
const coupon_entity_1 = require("../modules/inventory/entities/coupon.entity");
Object.defineProperty(exports, "Coupon", { enumerable: true, get: function () { return coupon_entity_1.Coupon; } });
const course_entity_1 = require("../modules/inventory/entities/course.entity");
Object.defineProperty(exports, "Course", { enumerable: true, get: function () { return course_entity_1.Course; } });
const issue_entity_1 = require("../modules/review/entities/issue.entity");
Object.defineProperty(exports, "Issue", { enumerable: true, get: function () { return issue_entity_1.Issue; } });
const question_entity_1 = require("../modules/review/entities/question.entity");
Object.defineProperty(exports, "Question", { enumerable: true, get: function () { return question_entity_1.Question; } });
const review_entity_1 = require("../modules/review/entities/review.entity");
Object.defineProperty(exports, "Review", { enumerable: true, get: function () { return review_entity_1.Review; } });
const review_request_entity_1 = require("../modules/review/entities/review_request.entity");
Object.defineProperty(exports, "ReviewRequest", { enumerable: true, get: function () { return review_request_entity_1.ReviewRequest; } });
const test_suite_entity_1 = require("../modules/review/entities/test_suite.entity");
Object.defineProperty(exports, "TestSuite", { enumerable: true, get: function () { return test_suite_entity_1.TestSuite; } });
const version_entity_1 = require("../modules/review/entities/version.entity");
Object.defineProperty(exports, "Version", { enumerable: true, get: function () { return version_entity_1.Version; } });
const recommendation_entity_1 = require("../modules/simulation/entities/recommendation.entity");
Object.defineProperty(exports, "Recommendation", { enumerable: true, get: function () { return recommendation_entity_1.Recommendation; } });
const sumitted_answer_entity_1 = require("../modules/simulation/entities/sumitted_answer.entity");
Object.defineProperty(exports, "SubmittedAnswer", { enumerable: true, get: function () { return sumitted_answer_entity_1.SubmittedAnswer; } });
const test_entity_1 = require("../modules/simulation/entities/test.entity");
Object.defineProperty(exports, "Test", { enumerable: true, get: function () { return test_entity_1.Test; } });
const test_assignment_entity_1 = require("../modules/simulation/entities/test_assignment.entity");
Object.defineProperty(exports, "TestAssignment", { enumerable: true, get: function () { return test_assignment_entity_1.TestAssignment; } });
const time_event_entity_1 = require("../modules/simulation/entities/time_event.entity");
Object.defineProperty(exports, "TimeEvent", { enumerable: true, get: function () { return time_event_entity_1.TimeEvent; } });
const image_entity_1 = require("../modules/media/entities/image.entity");
Object.defineProperty(exports, "Image", { enumerable: true, get: function () { return image_entity_1.Image; } });
const child_entity_1 = require("../modules/parent/entities/child.entity");
Object.defineProperty(exports, "Child", { enumerable: true, get: function () { return child_entity_1.Child; } });
const parent_entity_1 = require("../modules/parent/entities/parent.entity");
Object.defineProperty(exports, "Parent", { enumerable: true, get: function () { return parent_entity_1.Parent; } });
const parent_subscription_entity_1 = require("../modules/parent/entities/parent-subscription.entity");
Object.defineProperty(exports, "ParentSubscription", { enumerable: true, get: function () { return parent_subscription_entity_1.ParentSubscription; } });
const organization_subscription_entity_1 = require("../modules/demo/entities/organization-subscription.entity");
Object.defineProperty(exports, "OrgSubscription", { enumerable: true, get: function () { return organization_subscription_entity_1.OrgSubscription; } });
const parent_demo_request_entity_1 = require("../modules/demo/entities/parent-demo-request.entity");
Object.defineProperty(exports, "ParentDemoRequest", { enumerable: true, get: function () { return parent_demo_request_entity_1.ParentDemoRequest; } });
const school_demo_entity_1 = require("../modules/demo/entities/school-demo.entity");
Object.defineProperty(exports, "SchoolDemo", { enumerable: true, get: function () { return school_demo_entity_1.SchoolDemo; } });
const student_demo_request_entity_1 = require("../modules/demo/entities/student-demo-request.entity");
Object.defineProperty(exports, "StudentDemoRequest", { enumerable: true, get: function () { return student_demo_request_entity_1.StudentDemoRequest; } });
const student_subscription_entity_1 = require("../modules/demo/entities/student-subscription.entity");
Object.defineProperty(exports, "StudentSubscription", { enumerable: true, get: function () { return student_subscription_entity_1.StudentSubscription; } });
const subscription_plan_entity_1 = require("../modules/demo/entities/subscription-plan.entity");
Object.defineProperty(exports, "SubscriptionPlan", { enumerable: true, get: function () { return subscription_plan_entity_1.SubscriptionPlan; } });
const school_student_entity_1 = require("../modules/school/entities/school-student.entity");
Object.defineProperty(exports, "SchoolStudent", { enumerable: true, get: function () { return school_student_entity_1.SchoolStudent; } });
exports.entities = [
    admin_entity_1.Admin,
    cart_entity_1.Cart,
    category_entity_1.Category,
    checkout_entity_1.Checkout,
    child_entity_1.Child,
    coupon_entity_1.Coupon,
    course_entity_1.Course,
    image_entity_1.Image,
    instructor_entity_1.Instructor,
    issue_entity_1.Issue,
    organization_subscription_entity_1.OrgSubscription,
    organization_entity_1.Organization,
    parent_entity_1.Parent,
    parent_demo_request_entity_1.ParentDemoRequest,
    parent_subscription_entity_1.ParentSubscription,
    question_entity_1.Question,
    recommendation_entity_1.Recommendation,
    review_entity_1.Review,
    review_request_entity_1.ReviewRequest,
    school_demo_entity_1.SchoolDemo,
    school_student_entity_1.SchoolStudent,
    student_entity_1.Student,
    student_demo_request_entity_1.StudentDemoRequest,
    student_subscription_entity_1.StudentSubscription,
    sumitted_answer_entity_1.SubmittedAnswer,
    subscription_plan_entity_1.SubscriptionPlan,
    test_entity_1.Test,
    test_assignment_entity_1.TestAssignment,
    test_suite_entity_1.TestSuite,
    time_event_entity_1.TimeEvent,
    version_entity_1.Version,
];
//# sourceMappingURL=entities.js.map