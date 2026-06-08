# Frontend Integration Prompt — Account Deletion & Data Privacy

## Context

The Examforge backend has implemented a GDPR/CCPA/COPPA-compliant "right to be forgotten" account deletion flow. This document is the complete integration specification for the frontend team.

---

## Overview

Account deletion is a **two-phase, 90-day grace period** flow:

1. **Request deletion** — user triggers the mutation; account is immediately deactivated (JWTs expire within 24h). A farewell email is sent with the purge date.
2. **Permanent purge** — after 90 days, the backend automatically and permanently deletes all personal data.
3. **Cancellation window** — if the user logs back in at any point within the 90-day window, the deletion is automatically cancelled and the account is fully restored. A restoration confirmation email is sent.

There are **three user types** with distinct flows: **Student**, **Parent**, and **Child** (a child account is a student account created and managed by a parent).

---

## GraphQL Endpoint

```
POST http://localhost:4000/graphql          # development
POST https://api.examforge.com/graphql     # production
```

All mutations require a valid JWT in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## Mutations

### 1. Student — Request Account Deletion

Callable by any authenticated **student** (non-child) account.

```graphql
mutation RequestStudentAccountDeletion {
  requestStudentAccountDeletion {
    message
  }
}
```

**Success response:**
```json
{
  "data": {
    "requestStudentAccountDeletion": {
      "message": "Account deletion requested. Your account will be permanently deleted in 90 days. Log in any time within 90 days to cancel."
    }
  }
}
```

**Possible errors:**

| HTTP-equivalent | `message` | When |
|---|---|---|
| 403 Forbidden | `"Children cannot delete their own accounts."` | JWT role is `CHILD` — child accounts can only be deleted by their parent |
| 403 Forbidden | `"Child accounts can only be deleted by a parent."` | Student is linked to a parent as a child |
| 400 Bad Request | `"Account deletion already requested"` | Deletion was already requested and grace period is active |
| 404 Not Found | `"Student not found"` | JWT references a deleted or unknown user |

**Side effects:**
- User is immediately deactivated; existing JWTs will be rejected within 24h (token TTL)
- Confirmation email is sent to the user's registered email address with the purge date (90 days from now)
- A background job is scheduled to permanently purge all data after 90 days

---

### 2. Parent — Request Account Deletion

Callable by any authenticated **parent** account.

```graphql
mutation RequestParentAccountDeletion {
  requestParentAccountDeletion {
    message
  }
}
```

**Success response:**
```json
{
  "data": {
    "requestParentAccountDeletion": {
      "message": "Account deletion requested. Your account will be permanently deleted in 90 days. Log in any time within 90 days to cancel."
    }
  }
}
```

**Possible errors:**

| HTTP-equivalent | `message` | When |
|---|---|---|
| 400 Bad Request | `"Account deletion already requested"` | Deletion already in progress |
| 404 Not Found | `"Parent not found"` | JWT references unknown user |

**Side effects:**
- **All linked child student accounts are also deactivated automatically.** The parent does not need to delete children separately.
- Confirmation email sent to parent
- Background purge job scheduled for parent and all children (90 days)

---

### 3. Parent — Delete a Single Child

Callable by an authenticated **parent** to delete one specific child. Does **not** delete the parent account.

```graphql
mutation DeleteChild($childId: String!) {
  deleteChild(childId: $childId) {
    message
  }
}
```

**Variables:**
```json
{ "childId": "<uuid of the child record>" }
```

**Success response:**
```json
{
  "data": {
    "deleteChild": {
      "message": "Child account deletion requested."
    }
  }
}
```

**Possible errors:**

| HTTP-equivalent | `message` | When |
|---|---|---|
| 403 Forbidden | `"You are not authorized to delete this child account"` | Authenticated parent does not own this child |
| 404 Not Found | `"Child not found"` | `childId` does not exist |

**Side effects:**
- The child's linked student account is deactivated (90-day purge scheduled)
- The child record is unlinked from the student immediately
- The parent account remains active and unaffected

---

## Login / Account Restoration

When a deactivated user attempts to log in within the 90-day window, the backend **automatically restores the account** — no separate "undo deletion" endpoint is needed.

The login mutations (`loginStudent` / `loginParent`) handle this transparently:
- If account is deactivated and < 90 days have passed → account is restored, deletion job cancelled, token returned normally
- If account is deactivated and ≥ 90 days have passed → `400 Bad Request: "This account no longer exists."`

**Frontend requirement:** Simply allow the user to log in normally. No special handling is needed beyond displaying the restored confirmation (optionally read `response.message` or listen for the restoration email).

---

## UI / UX Requirements

### Settings Page — "Delete Account" Section

**For Students:**
- Show a "Delete My Account" button in account settings
- On click: show a confirmation modal explaining:
  - Data that will be deleted (profile, personal info)
  - Data that will be retained (anonymised test scores, subscription receipts)
  - The 90-day cancellation window (log in to cancel)
  - Estimated purge date (today + 90 days, formatted)
- On confirm: call `requestStudentAccountDeletion`
- On success: log the user out locally (clear JWT from storage), redirect to login/home with a message: *"Your account has been scheduled for deletion. You have 90 days to log in and cancel."*
- On error `403 CHILD`: hide the button entirely for child accounts (the parent portal handles this)

**For Parents:**
- Show "Delete My Account" in account settings
- Confirmation modal must **explicitly warn** that all child accounts will also be deactivated
- On confirm: call `requestParentAccountDeletion`
- On success: log out, redirect with the 90-day message

**For Parents — Manage Children:**
- On each child card in the children management section, show a "Remove child" / "Delete child account" action
- Confirmation modal: explain the child's account will be permanently deleted after 90 days
- On confirm: call `deleteChild(childId: child.id)`
- On success: refresh the children list (child will no longer appear)

### Login Page — Restoration Toast

After a successful login where the account was previously deactivated, the backend sends a restoration email but does **not** return a special flag in the login response. If you want to show an in-app restoration notice, check for a restoration email sent to the user or store a `was_deactivated` flag client-side before the login attempt.

### Expired Account (> 90 days)

If login returns `400: "This account no longer exists."`, show a dedicated screen:
- *"This account has been permanently deleted and can no longer be recovered."*
- Link to create a new account

---

## Error Handling Pattern

All errors come back as GraphQL errors (not HTTP 4xx). The shape is:

```json
{
  "errors": [
    {
      "message": "<human-readable message from the backend>",
      "extensions": {
        "code": "BAD_USER_INPUT" | "FORBIDDEN" | "NOT_FOUND"
      }
    }
  ]
}
```

Map `extensions.code` to UI copy:
- `FORBIDDEN` → show inline error, do not log out
- `BAD_USER_INPUT` → show inline error (e.g. "Deletion already in progress")
- `NOT_FOUND` → treat as session expired, force re-login

---

## Data Retention Transparency (Privacy Policy UI)

The following must be surfaced in any privacy/data transparency screen:

| Data type | What happens |
|---|---|
| Profile (name, email, phone) | **Permanently deleted** after 90-day grace period |
| Passwords & tokens | **Permanently deleted** immediately on purge |
| Test scores & performance stats | **Anonymised** (retained for product analytics, no longer linked to identity) |
| Subscription & payment references | **Retained for 7 years** (financial compliance) — linked to `paystack_reference`, not personal data |
| Child accounts | **Deactivated simultaneously** when parent account is deleted |

---

## Test Credentials (Dev/Staging Only)

Use the normal registration/login flow. To test the 90-day expiry without waiting, ask the backend team to manually set `deactivated_at` to a date > 90 days ago in the test database.
