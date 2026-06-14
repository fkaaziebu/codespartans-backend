# Frontend Implementation Prompt — Auth Flow Updates & Account Deletion V2

## Context

The CodeSpartans backend has shipped a set of new features around account management. Both the **Student frontend** (`localhost:3000`) and the **Parent frontend** (`localhost:3001`) need to implement the flows described below. The GraphQL endpoint is `http://localhost:4000/graphql`.

> **Note:** This supersedes the cancellation behaviour described in `account-deletion.md`. Accounts are no longer auto-restored on login. The OTP flow described here is now the only cancellation path.

---

## 1. Login — Pending Deletion State

**Affected: Student & Parent**

The login mutations (`loginStudent`, `loginParent`) now return two new optional fields:

```graphql
account_status: AccountStatus       # "ACTIVE" | "PENDING_DELETION" | "DELETED"
deletion_scheduled_for: DateTime    # present when PENDING_DELETION
refresh_token: String               # now nullable — absent when PENDING_DELETION
```

**When `account_status === "PENDING_DELETION"`:**

- The `token` returned is a **short-lived 15-minute pending-deletion token**. Do not store it as a normal session.
- `refresh_token` will be **absent**.
- `deletion_scheduled_for` is the UTC date the account will be permanently deleted.
- The backend has already emailed the user a 6-digit OTP to their registered address.
- Show a dedicated **"Account Pending Deletion"** screen/modal with:
  - A message explaining the account is scheduled for deletion on `deletion_scheduled_for`.
  - A 6-digit OTP input + **"Verify & Cancel Deletion"** button.
  - A **"Log out / Dismiss"** option.
  - Send the pending-deletion token as `Authorization: Bearer <token>` for all OTP flow requests.

**When `account_status === "ACTIVE"`** (normal case): proceed as before.

---

## 2. OTP Verification + Cancellation Flow

**Affected: Student & Parent**

Two-step flow. Both steps require the **pending-deletion token** as the auth header.

### Step 1 — Verify OTP

```graphql
# Student
mutation VerifyStudentCancellationOtp($otp: String!) {
  verifyCancellationOtp(otp: $otp) {
    message
  }
}

# Parent
mutation VerifyParentCancellationOtp($otp: String!) {
  verifyCancellationOtp(otp: $otp) {
    message
  }
}
```

On success: show a confirmation prompt ("Your account deletion will be cancelled. Confirm?").

### Step 2 — Cancel Deletion

```graphql
# Student
mutation CancelStudentAccountDeletion {
  cancelStudentAccountDeletion {
    token
    refresh_token
    account_status
    name
    email
  }
}

# Parent
mutation CancelParentAccountDeletion {
  cancelParentAccountDeletion {
    token
    refresh_token
    account_status
    email
    first_name
    last_name
  }
}
```

On success: store the returned `token` + `refresh_token` as the normal session and redirect to the dashboard. Show a success toast: _"Your account has been restored."_

### Error Handling

| Error | Message to show |
|---|---|
| `400 Invalid or expired OTP.` | "The code is incorrect or has expired. Please try again." |
| `401` on Step 2 without Step 1 | "Please verify the OTP first." |
| OTP window expired (10 min) | Log out and prompt user to log in again to receive a new OTP. |
| Pending-deletion token expired (15 min) | Log out and prompt user to log in again. |

---

## 3. Change Password

**Affected: Student & Parent**

New mutations — requires a normal authenticated session:

```graphql
# Student
mutation ChangeStudentPassword($currentPassword: String!, $newPassword: String!) {
  changePassword(currentPassword: $currentPassword, newPassword: $newPassword) {
    message
  }
}

# Parent
mutation ChangeParentPassword($currentPassword: String!, $newPassword: String!) {
  changeParentPassword(currentPassword: $currentPassword, newPassword: $newPassword) {
    message
  }
}
```

**UX notes:**
- Add a "Change Password" option in account/settings.
- After success, **clear the session and redirect to login**. The backend invalidates all existing refresh tokens on password change.
- Show: _"Password changed successfully. Please log in with your new password."_

**Errors:**
- `400 Current password is incorrect` → inline field error on the current-password input.
- `400 Invalid credentials` → generic error (account not found; shouldn't happen for a logged-in user).

---

## 4. Change PIN (Child accounts only)

**Affected: Student frontend — child login flow**

```graphql
mutation ChangePin($currentPin: String!, $newPin: String!) {
  changePin(currentPin: $currentPin, newPin: $newPin) {
    message
  }
}
```

- Add a "Change PIN" option in the child's profile/settings.
- After success, clear the session and return to the child login screen.

**Errors:**
- `401 Current pin is incorrect` → inline error.
- `400 Child account not found` → generic error.

---

## 5. Token Refresh — New Rejection Cases

**Affected: Student & Parent**

The refresh token endpoints now reject with `401` in two additional cases. Update your token-refresh interceptor to handle them:

| Response message | Action |
|---|---|
| `"Account has been deactivated"` | Clear session, go to login, show: _"Your account has been deactivated."_ |
| `"Password was recently changed. Please log in again."` | Clear session, go to login, show: _"Your session expired due to a password change. Please log in again."_ |

---

## 6. Account Deletion Request — Updated Response Shape

**Affected: Student & Parent**

The deletion request mutations now return a richer response (previously only `message`):

```graphql
type AccountDeletionResponse {
  message:              String!
  deletionScheduledFor: DateTime!
  status:               AccountStatus!   # "PENDING_DELETION"
}
```

Update the post-deletion UI to show `deletionScheduledFor`, e.g.:

> _"Your account will be permanently deleted on 12 September 2026. Log in any time before then to cancel."_

**Already-pending case:** If the user requests deletion when their account is already pending, the backend now returns the same `AccountDeletionResponse` instead of an error. Handle this gracefully — show: _"Your account deletion is already pending."_ along with the existing `deletionScheduledFor`.

---

## 7. Parent: Cancel a Child's Account Deletion

**Affected: Parent frontend**

```graphql
mutation CancelChildDeletion($childId: ID!) {
  cancelChildDeletion(childId: $childId) {
    status
    deletionScheduledFor
    message
  }
}
```

- On the child management screen, if a child's student account is in a pending-deletion state, show a **"Cancel Deletion"** button alongside the child's name.
- On success (`status === "ACTIVE"`): show _"[Child's name]'s account has been restored."_ and refresh the child list.

**Errors:**
- `404 Child not found.` → generic error.
- `403` → the logged-in parent doesn't own this child.
- `404 No pending deletion found for this child account.` → child is already active; refresh the list.

---

## 8. Child Login — Pending Deletion Guard

**Affected: Parent frontend (child login / PIN entry screen)**

`loginChild` now returns `401` with the message:

> _"This account is pending deletion. Contact your parent to cancel."_

Display this as a distinct, prominent error on the PIN entry screen — not as a generic "Invalid PIN" message. Offer a link/button back to the parent dashboard where the parent can cancel the child's deletion.

---

## General Reference

### `AccountStatus` Enum

```graphql
enum AccountStatus {
  ACTIVE
  PENDING_DELETION
  DELETED
}
```

### Token TTLs

| Token | TTL |
|---|---|
| Normal access token | 1 hour |
| Normal refresh token | 30 days |
| Pending-deletion token | 15 minutes |
| OTP (in cache) | 10 minutes |
| OTP verified flag (in cache) | 10 minutes |

### Flow Diagram (Pending Deletion)

```
Login (deactivated within 90 days)
  └─► Returns pending_deletion token + sends OTP email
        └─► User enters OTP → verifyCancellationOtp  ✓
              └─► User confirms → cancelXxxAccountDeletion
                    └─► Returns normal session token → redirect to dashboard
```
