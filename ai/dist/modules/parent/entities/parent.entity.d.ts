import { Child } from './child.entity';
export declare enum Gender {
    Male = "Male",
    Female = "Female"
}
export declare class Parent {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    whatsapp_number: string;
    gender: Gender;
    password: string;
    is_account_validated: boolean;
    is_setup_completed: boolean;
    validation_code: string;
    reset_token: string;
    children: Child[];
}
