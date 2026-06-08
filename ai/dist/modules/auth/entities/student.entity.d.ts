import { Cart } from '../../inventory/entities/cart.entity';
import { Category } from '../../inventory/entities/category.entity';
import { Checkout } from '../../inventory/entities/checkout.entity';
import { Course } from '../../inventory/entities/course.entity';
import { Organization } from './organization.entity';
import { Test } from '../../simulation/entities/test.entity';
export declare class Student {
    id: string;
    name: string;
    email: string;
    password: string;
    reset_token: string;
    is_setup_completed: boolean;
    is_account_validated: boolean;
    validation_code: string;
    subscribed_courses: Course[];
    subscribed_categories: Category[];
    organizations: Organization[];
    checkouts: Checkout[];
    cart: Cart;
    tests: Test[];
}
