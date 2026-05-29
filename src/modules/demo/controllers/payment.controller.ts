import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from '../services/payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('paystack/webhook')
  async handlePaystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() body: any,
  ) {
    if (!signature) throw new BadRequestException('Missing signature header');

    console.log('PAYMENT_WEBHOOK_INITIALIZE');

    this.paymentService.verifyWebhookSignature(signature, req.rawBody);
    await this.paymentService.handleWebhookEvent(body.event, body.data);

    return { received: true };
  }
}
