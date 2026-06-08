import { Gender } from '../entities/parent.entity';
export declare class RegisterParentInput {
    first_name: string;
    last_name: string;
    email: string;
    whatsapp_number: string;
    password: string;
    gender?: Gender;
}
