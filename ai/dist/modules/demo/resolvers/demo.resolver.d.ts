import { ActivateParentDemoInput } from '../inputs/activate-parent-demo.input';
import { ActivateSchoolDemoInput } from '../inputs/activate-school-demo.input';
import { ActivateStudentDemoInput } from '../inputs/activate-student-demo.input';
import { BookParentFreeDemoInput } from '../inputs/book-parent-free-demo.input';
import { BookSchoolFreeDemoInput } from '../inputs/book-school-free-demo.input';
import { BookStudentFreeDemoInput } from '../inputs/book-student-free-demo.input';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { DemoService } from '../services/demo.service';
import { ParentSubscription } from 'src/modules/parent/entities/parent-subscription.entity';
import { StudentSubscription } from '../entities/student-subscription.entity';
export declare class DemoResolver {
    private readonly demoService;
    constructor(demoService: DemoService);
    bookSchoolFreeDemo(input: BookSchoolFreeDemoInput): Promise<{
        message: string;
    }>;
    bookParentFreeDemo(input: BookParentFreeDemoInput): Promise<{
        message: string;
    }>;
    bookStudentFreeDemo(input: BookStudentFreeDemoInput): Promise<{
        message: string;
    }>;
    activateSchoolDemo(input: ActivateSchoolDemoInput): Promise<{
        access_token: string;
        org_name: string;
        email: string;
        expires_at: string;
    }>;
    activateStudentDemo(input: ActivateStudentDemoInput): Promise<{
        token: string;
        refresh_token: string;
        expires_at: string;
        id: string;
        name: string;
        email: string;
        password: string;
        reset_token: string;
        is_setup_completed: boolean;
        is_account_validated: boolean;
        validation_code: string;
        subscribed_courses: import("../../inventory/entities/course.entity").Course[];
        subscribed_categories: import("../../inventory/entities/category.entity").Category[];
        organizations: import("../../auth/entities/organization.entity").Organization[];
        checkouts: import("../../inventory/entities/checkout.entity").Checkout[];
        cart: import("../../inventory/entities/cart.entity").Cart;
        tests: import("../../simulation/entities/test.entity").Test[];
    }>;
    activateParentDemo(input: ActivateParentDemoInput): Promise<{
        token: string;
        refresh_token: string;
        expires_at: string;
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        whatsapp_number: string;
        gender: import("../../parent/entities/parent.entity").Gender;
        password: string;
        is_account_validated: boolean;
        is_setup_completed: boolean;
        validation_code: string;
        reset_token: string;
        children: import("../../parent/entities/child.entity").Child[];
    }>;
    listSubscriptionPlans(): Promise<SubscriptionPlan[]>;
    initiatePayment(planId: string, children: string[], context: any): Promise<{
        authorization_url: string;
        reference: string;
    }>;
    getMySubscription(context: any): Promise<ParentSubscription>;
    listMySubscriptions(context: any): Promise<ParentSubscription[]>;
    getMyStudentSubscription(context: any): Promise<StudentSubscription>;
    listMyStudentSubscriptions(context: any): Promise<StudentSubscription[]>;
}
