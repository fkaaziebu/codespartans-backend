# Demo & Payment System

## Overview

This document describes the full lifecycle of a school free-demo request, trial activation, expiry, and the payment upgrade path. It covers the current implementation and the planned work still to be built.

---

## 1. The Demo Lifecycle

```
School books demo  →  Demo record created  →  Email sent with registration URL
       ↓
School registers with demo_code  →  Trial ACTIVATED (status: active, expires_at set)
       ↓
School uses platform during trial (14 days default)
       ↓
Trial expires  →  Access blocked  →  Prompt to pay
       ↓
School pays  →  Subscription created  →  Full access restored (status: converted)
```

---

## 2. Current Implementation

### 2.1 `bookSchoolFreeDemo` Mutation

**File:** `src/modules/demo/resolvers/demo.resolver.ts`

Public GraphQL mutation — no authentication required.

```graphql
mutation BookSchoolFreeDemo($input: BookSchoolFreeDemoInput!) {
  bookSchoolFreeDemo(input: $input) {
    message
  }
}
```

**Input fields:**

| Field | Type | Description |
|---|---|---|
| `name` | `String` | Contact person's full name |
| `school_name` | `String` | Name of the school or learning center |
| `role` | `SchoolDemoRole` | Contact's role at the institution |
| `approximate_students` | `ApproximateStudents` | Approximate number of enrolled students |
| `email` | `String` | Contact email — unique per demo request |
| `whatsapp_number` | `String` | Contact WhatsApp number |

**Enum: `SchoolDemoRole`**
- `proprietor_owner`
- `headmaster_principal`
- `academic_director`
- `teacher`
- `other`

**Enum: `ApproximateStudents`**
- `under_50`
- `50_to_100`
- `100_to_300`
- `300_to_500`
- `above_500`

### 2.2 `SchoolDemo` Entity

**File:** `src/modules/demo/entities/school-demo.entity.ts`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | string | Contact name |
| `school_name` | string | Institution name |
| `role` | enum | `SchoolDemoRole` |
| `approximate_students` | enum | `ApproximateStudents` |
| `email` | string (unique) | One demo per email |
| `whatsapp_number` | string | |
| `demo_code` | string (unique) | UUID generated on booking |
| `status` | enum | `DemoStatus`: pending → active → expired / converted |
| `activated_at` | timestamptz | Set when school registers with the code |
| `expires_at` | timestamptz | `activated_at + trial_duration_days` |
| `trial_duration_days` | int | Default: 14 |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Enum: `DemoStatus`**
- `pending` — demo booked, email sent, account not yet created
- `active` — school registered with demo_code, trial running
- `expired` — trial period elapsed
- `converted` — school has paid and holds an active subscription

### 2.3 Email

**Template:** `src/modules/auth/services/templates/demo-invitation.hbs`

The email contains:
- A personalised greeting with the contact name and school name
- The trial duration in days
- A CTA button that links to `SCHOOL_DEMO_URL/register?demo_code=<uuid>`
- A plain-text fallback URL

**Queue job name:** `send-demo-invitation`

### 2.4 Environment Variable

| Variable | Purpose | Default |
|---|---|---|
| `SCHOOL_DEMO_URL` | Base URL of the school-facing frontend | `http://localhost:3000` |

Add to `.env.development.local` and `.env` for production:
```
SCHOOL_DEMO_URL=https://school.codespartans.com
```

---

## 3. Middleware (SubscriptionGuard)

**File:** `src/helpers/guards/subscription.guard.ts`

A NestJS `CanActivate` guard stacked alongside `GqlJwtAuthGuard` on gated resolvers. It runs after JWT verification and checks access status.

### Guard logic

```
User role == STUDENT
  → load student.organizations with school_demo
  → if no orgs: pass through (independent student)
  → for each org: check demo/subscription → if any valid: allow
  → else: throw ForbiddenException { code: SUBSCRIPTION_REQUIRED }

User role == ORGANIZATION
  → load org with school_demo
  → check demo/subscription → if valid: allow
  → else: throw ForbiddenException { code: SUBSCRIPTION_REQUIRED }

User role == INSTRUCTOR / ADMIN / PARENT / CHILD
  → pass through (not gated)
```

### Access is valid when:
- `org.school_demo.status === active` AND `org.school_demo.expires_at > now`, **OR**
- An `OrgSubscription` record exists with `status === active` AND `expires_at > now`

### Gated endpoints

**Simulation** (`src/modules/simulation/resolvers/student.resolver.ts`):
- `getSubscribedCourseDetails`, `getQuestion`, `testStats`, `getAllAttemptedQuestions`
- `startTest`, `pauseTest`, `resumeTest`, `endTest`, `submitAnswer`

**Inventory** (`src/modules/inventory/resolvers/student.resolver.ts`):
- `getOrganizationCourse`, `listOrganizationCourses`, `listOrganizationCategories`

### How to add the guard to a new resolver

```typescript
import { GqlJwtAuthGuard, SubscriptionGuard } from 'src/helpers/guards';

@UseGuards(GqlJwtAuthGuard, SubscriptionGuard)
@Query(() => SomeType)
async someGatedQuery() { ... }
```

The module hosting the resolver must import `DemoModule` so that `SubscriptionGuard` (exported from `DemoModule`) is available in the DI context.

---

## 4. Payment Integration (Paystack)

### Payment Flow

```
School hits expiry wall
       ↓
Frontend calls `initiatePayment(planId: String!)`  [requires ORGANIZATION JWT]
       ↓
Backend hits Paystack /transaction/initialize → returns authorization_url + reference
       ↓
Frontend redirects school to Paystack checkout page
       ↓
School pays on Paystack
       ↓
Paystack fires POST /payments/paystack/webhook
       ↓
Backend verifies HMAC-SHA512 signature
       ↓
Handles charge.success → creates OrgSubscription (started_at, expires_at)
       ↓
School now has active paid subscription → SubscriptionGuard allows access
```

### GraphQL API

| Operation | Auth | Description |
|---|---|---|
| `listSubscriptionPlans` (Query) | Public | Returns all active plans with price and duration |
| `initiatePayment(planId)` (Mutation) | ORGANIZATION JWT | Creates Paystack session, returns `authorization_url` and `reference` |

### REST API

| Method + Path | Description |
|---|---|
| `POST /payments/paystack/webhook` | Receives Paystack webhook events |

### Webhook Security

The handler calls `verifyWebhookSignature(signature, rawBody)` before processing any event. NestJS is started with `rawBody: true` so the raw `Buffer` is available on `req.rawBody`. The signature is HMAC-SHA512 of the raw body using `PAYSTACK_SECRET_KEY`.

**Paystack dashboard configuration:** set the webhook URL to `https://your-domain.com/payments/paystack/webhook` and enable the `charge.success` event.

---

## 5. Trial Activation

**Mutation:** `activateSchoolDemo(input: ActivateSchoolDemoInput)`

Input: `{ demo_code: string, password: string }`

Steps:
1. Look up `SchoolDemo` by `demo_code`; verify `status === pending`
2. Check no `Organization` already exists with that email
3. Create `Organization` (name = `school_name`, email from demo, hashed password)
4. Link `org.school_demo = demo`
5. Set `demo.status = active`, `demo.activated_at = now()`, `demo.expires_at = now() + trial_duration_days`
6. Return JWT access token for the new organization

This is a single atomic transaction (TypeORM `manager.transaction`).

---

## 6. Planned Work

### 6.1 Subscription Expiry Job

A daily background job (use `@nestjs/schedule`) should:
1. Find `OrgSubscription` records where `status = active` AND `expires_at < now()`
2. Set `status = expired`
3. Find `SchoolDemo` records where `status = active` AND `expires_at < now()`
4. Set `status = expired`
5. Optionally send expiry notification emails

### 6.2 WhatsApp Notifications

Currently the WhatsApp number is stored but no messages are sent. Recommended providers for the West African market:
- **Termii** — popular in Nigeria, supports WhatsApp + SMS
- **Twilio WhatsApp API** — quickest to integrate globally
- **Meta Cloud API** — free tier, requires Facebook Business verification

Create a `WhatsappService` mirroring `EmailService` and add it to the `email-queue` consumer (or a separate `whatsapp-queue`).

### 6.3 Manual Payment Verification Fallback

Add a `verifyPayment(reference: String!)` mutation that calls Paystack's `GET /transaction/verify/:reference` for cases where the webhook is missed.

---

## 7. File Map

```
src/
├── main.ts                              # rawBody: true (for webhook verification)
├── config.schema.ts                     # + PAYSTACK_SECRET_KEY, SCHOOL_DEMO_URL
│
├── helpers/guards/
│   ├── subscription.guard.ts            # NEW – checks demo/subscription access
│   └── index.ts                         # + SubscriptionGuard export
│
└── modules/
    ├── auth/
    │   ├── entities/
    │   │   └── organization.entity.ts   # + school_demo OneToOne
    │   ├── auth.module.ts               # + exports EmailProducer
    │   └── services/
    │       ├── email.service.ts         # + sendDemoInvitationEmail
    │       ├── email.producer.ts        # + sendDemoInvitationEmail
    │       ├── email.consumer.ts        # + send-demo-invitation case
    │       └── templates/
    │           └── demo-invitation.hbs  # NEW
    │
    ├── demo/
    │   ├── demo.module.ts               # imports AuthModule; exports TypeOrmModule + SubscriptionGuard
    │   ├── controllers/
    │   │   └── payment.controller.ts    # POST /payments/paystack/webhook
    │   ├── entities/
    │   │   ├── school-demo.entity.ts    # SchoolDemo + DemoStatus enum
    │   │   ├── subscription-plan.entity.ts
    │   │   └── organization-subscription.entity.ts
    │   ├── inputs/
    │   │   ├── book-school-free-demo.input.ts
    │   │   └── activate-school-demo.input.ts
    │   ├── resolvers/
    │   │   └── demo.resolver.ts         # bookSchoolFreeDemo, activateSchoolDemo,
    │   │                                #   listSubscriptionPlans, initiatePayment
    │   ├── services/
    │   │   ├── demo.service.ts
    │   │   └── payment.service.ts       # Paystack API + webhook handler
    │   └── types/
    │       ├── book-demo-response.type.ts
    │       ├── activate-demo-response.type.ts
    │       └── initiate-payment-response.type.ts
    │
    ├── simulation/
    │   ├── simulation.module.ts         # + imports DemoModule
    │   └── resolvers/student.resolver.ts # gated with SubscriptionGuard
    │
    └── inventory/
        ├── inventory.module.ts          # + imports DemoModule
        └── resolvers/student.resolver.ts # org endpoints gated with SubscriptionGuard
```

---

## 8. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PAYSTACK_SECRET_KEY` | Yes | Paystack secret key (sk_live_... or sk_test_...) |
| `SCHOOL_DEMO_URL` | No (default: localhost:3000) | Base URL of the school-facing frontend |

Add to `.env` (prod) and `.env.development.local` (dev):
```
PAYSTACK_SECRET_KEY=sk_test_...
SCHOOL_DEMO_URL=https://school.codespartans.com
```

---

## 9. Security Considerations

- **Demo codes are UUIDs** — single-use: activation sets status to `active`, preventing re-use.
- **Webhook signature** is HMAC-SHA512 verified on every incoming event before any processing.
- **Raw body preservation** — `NestFactory.create(AppModule, { rawBody: true })` ensures the signature can be re-computed from the unmodified payload.
- **Idempotency** — the webhook handler checks for existing `paystack_reference` before creating a subscription to safely handle duplicate deliveries.
- **Rate-limit** `bookSchoolFreeDemo` to prevent spam (use `@nestjs/throttler`).
- **Paystack secret key** is never sent to the frontend — only the `authorization_url` and `reference` are exposed.
