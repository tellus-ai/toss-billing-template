import * as z from 'zod';
import type { AuthSession, Billing, Checkout, PaymentMethod, Subscription, User } from './types';

/** 서버 응답을 화면에 넘기기 전에 계약과 같은지 확인하는 스키마입니다. */

export const userSchema: z.ZodType<User> = z.object({
  loginId: z.string(),
  name: z.string(),
  email: z.string().nullable(),
});

export const paymentMethodSchema: z.ZodType<PaymentMethod> = z.object({
  id: z.string(),
  cardCompany: z.string(),
  maskedNumber: z.string(),
  isDefault: z.boolean(),
});

const isoDateTime = z.iso.datetime({ offset: true });

export const subscriptionSchema: z.ZodType<Subscription> = z.object({
  status: z.enum(['ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELED']),
  planName: z.string(),
  startedAt: isoDateTime,
  nextBillingAt: isoDateTime,
  cancelAt: isoDateTime.nullable(),
});

const amount = z.number().int().nonnegative();

export const checkoutSchema: z.ZodType<Checkout> = z.object({
  subscription: subscriptionSchema.nullable(),
  paymentMethod: paymentMethodSchema.nullable(),
  quote: z.object({ supplyAmount: amount, vatAmount: amount, totalAmount: amount }),
  startsAt: isoDateTime,
  nextBillingAt: isoDateTime,
});

export const billingSchema: z.ZodType<Billing> = z.object({
  subscription: subscriptionSchema.nullable(),
  paymentMethods: z.array(paymentMethodSchema),
  payments: z.array(
    z.object({
      id: z.string(),
      paidAt: isoDateTime,
      type: z.string(),
      orderName: z.string(),
      amount,
      status: z.string(),
      receiptUrl: z.url().nullable(),
    }),
  ),
  usage: z.object({ usedUnits: z.number().nonnegative(), includedUnits: z.number().positive(), unitLabel: z.string() }),
  nextCharge: z.object({ subscriptionAmount: amount, overageAmount: amount, totalAmount: amount }),
});

export const authSessionSchema: z.ZodType<AuthSession> = z.object({
  customerKey: z.string().min(22).max(50),
});

export const errorBodySchema = z.object({ code: z.string(), message: z.string() });
