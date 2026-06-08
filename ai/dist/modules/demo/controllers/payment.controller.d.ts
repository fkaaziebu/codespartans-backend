import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from '../services/payment.service';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    handlePaystackWebhook(signature: string, req: RawBodyRequest<Request>, body: any): Promise<{
        received: boolean;
    }>;
}
