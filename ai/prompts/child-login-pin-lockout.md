# Frontend Implementation Prompt — Child Login PIN Lockout & Reset

## Context

The `loginChild` mutation has been hardened with stateful attempt tracking and a 5-minute lockout after 5 consecutive wrong PIN entries. A new `requestChildPinReset` mutation lets a locked-out child notify their parent by email. The parent's existing `resetChildPin` mutation now also clears the lockout immediately so the child can log in right after the parent resets their PIN.

**Affected frontend:** Parent portal (`localhost:3001`) — child PIN entry screen and parent dashboard.

The GraphQL endpoint is `http://localhost:4000/graphql`.

---

## 1. Updated `loginChild` Error Behavior

The two-step child login flow is unchanged:

```
Step 1 — verifyChildUsername(username) → temp_token (valid for 5 minutes)
Step 2 — loginChild(temp_token, pin) → token + refresh_token
```

What changed is **Step 2**. Wrong PIN attempts now return structured errors instead of a generic "Invalid pin" message.

### Error messages by attempt number

| Attempt # | `error.message` |
|-----------|----------------|
| 1st wrong | `"Incorrect PIN, try again"` |
| 2nd wrong | `"Incorrect PIN, you have 3 more attempts"` |
| 3rd wrong | `"Incorrect PIN, you have 2 more attempts"` |
| 4th wrong | `"Incorrect PIN, you have 1 more attempt. Your account will be locked for 5 minutes if this fails"` |
| 5th wrong | `"Account locked for 5 minutes"` |
| While locked | `"Account locked for 5 minutes"` |

> **Note on error format:** In production, the GraphQL error shape is `{ message: string, extensions: { code: "UNAUTHORIZED" } }`. The `message` field is the primary — and in production the only — discriminator between these states. In non-production environments, `extensions.originalError` also contains `{ code, attempts_remaining, locked_at }` for debugging.

### `loginChild` mutation (unchanged signature)

```graphql
mutation LoginChild($input: LoginChildInput!) {
  loginChild(input: $input) {
    token
    refresh_token
    id
    full_name
    username
  }
}
```

### UX requirements

**Attempt 1:** Show a standard "Incorrect PIN" inline error. No attempt counter shown yet.

**Attempts 2–3:** Show the message directly, e.g. _"Incorrect PIN, you have 3 more attempts"_. Keep the PIN input active.

**Attempt 4:** Show the message with urgency styling — e.g. _"Incorrect PIN, you have 1 more attempt. Your account will be locked for 5 minutes if this fails."_ Consider a red/warning colour on the input border.

**Attempt 5 (lockout triggered):** Receive `"Account locked for 5 minutes"`. Immediately transition to the **lockout screen** (see §2 below).

**While locked (subsequent calls):** Any further `loginChild` call returns `"Account locked for 5 minutes"`. The PIN input should be disabled during the lockout period — do not allow the child to keep submitting.

---

## 2. Lockout Screen

When the 5th wrong attempt fires (or when any `loginChild` call returns `"Account locked for 5 minutes"`), replace the PIN input with a lockout screen:

```
┌─────────────────────────────────────────────────────────┐
│  🔒  Too many wrong attempts                            │
│                                                         │
│  Your account has been locked for 5 minutes.           │
│                                                         │
│  [Countdown timer: 4:59 ...]                           │
│                                                         │
│  You can wait for the timer to expire, or ask your      │
│  parent to reset your PIN.                              │
│                                                         │
│  [Request PIN reset from parent]                        │
└─────────────────────────────────────────────────────────┘
```

**Timer:** Start a 5-minute (300-second) countdown from the moment the lockout error is first received. The timer is client-side — you do not need to poll the server. When the timer reaches zero, allow the child to re-enter their username to get a fresh `temp_token` and try again.

**"Request PIN reset from parent" button:** Calls the new `requestChildPinReset` mutation (see §3). Disable the button after one successful press to prevent duplicate emails.

---

## 3. New Mutation: `requestChildPinReset`

Sends an email to the child's parent informing them that their child wants a PIN reset. Only callable while the account is locked.

```graphql
mutation RequestChildPinReset($input: RequestChildPinResetInput!) {
  requestChildPinReset(input: $input)
}
```

**Input:**
```graphql
input RequestChildPinResetInput {
  temp_token: String!   # The same temp_token from verifyChildUsername
}
```

**Returns:** `Boolean` (`true` on success).

**When to call:** When the child taps "Request PIN reset from parent" on the lockout screen. Pass the `temp_token` obtained from Step 1.

**Temp token expiry note:** The `temp_token` from `verifyChildUsername` is valid for only 5 minutes. If the child reaches the lockout during that window, the token is still valid. If the 5-minute token window has also expired by the time they tap the button, call `verifyChildUsername` again with the username to get a fresh token before calling `requestChildPinReset`.

### UX after success

Show a confirmation:

> _"We've notified your parent. They'll receive an email with instructions to reset your PIN."_

Disable the button and do not allow repeat requests.

### Error handling

| Error | When it happens | Show |
|-------|----------------|------|
| `"Account is not currently locked"` | Account lock expired before button was pressed | Hide the button; let the countdown complete normally |
| `"Invalid or expired token"` | `temp_token` expired | Re-run `verifyChildUsername` silently, then retry |
| `401` / network error | Generic | _"Something went wrong. Please try again."_ |

---

## 4. Parent Dashboard — PIN Reset Clears the Lockout

No API change is needed here — `resetChildPin` signature is unchanged:

```graphql
mutation ResetChildPin($childId: ID!) {
  resetChildPin(childId: $childId) {
    message
    pin
  }
}
```

**What's new:** When the parent resets a child's PIN, the backend now also clears the lockout state from Redis. This means the child can log in immediately with the new PIN without waiting for the 5-minute lockout to expire.

**UX note:** If you show a message to the parent after resetting the PIN (e.g. _"PIN reset successfully. New PIN: 123456"_), consider adding: _"Your child can log in immediately with their new PIN."_ This is especially helpful if the parent reset the PIN in response to a lockout-notification email.

---

## 5. Full Flow Diagrams

### Child cannot remember PIN

```
verifyChildUsername(username) → temp_token
  └─► loginChild(temp_token, wrong_pin) × 5
        └─► Lockout screen shown
              ├─► Wait 5 minutes → re-enter username → fresh temp_token → try again
              └─► "Request PIN reset from parent"
                    └─► requestChildPinReset(temp_token) → email sent to parent
                          └─► Parent opens dashboard → resetChildPin(childId)
                                └─► Child: re-enter username → fresh temp_token → loginChild with new PIN ✓
```

### Returning while still locked (e.g. child closes and reopens the app)

```
verifyChildUsername(username) → temp_token
  └─► loginChild(temp_token, any_pin)
        └─► "Account locked for 5 minutes" → show lockout screen
              (UI starts 5-min timer from now — conservative, actual expiry may be sooner)
```

---

## 6. State Management Checklist

- [ ] Track lockout state locally (boolean + client-side countdown) after receiving `"Account locked for 5 minutes"`
- [ ] Clear lockout state when the countdown reaches zero or when `loginChild` succeeds
- [ ] Disable the PIN input and submit button while locked
- [ ] Disable the "Request PIN reset" button after one successful call
- [ ] Handle expired `temp_token` gracefully — silently refresh via `verifyChildUsername` before retrying `requestChildPinReset`
- [ ] On the parent dashboard, update any child-status messaging to clarify the child can log in immediately after PIN reset

---

## 7. Error Message Reference

All errors come from `errors[0].message` in the GraphQL response.

| `message` | State | Action |
|-----------|-------|--------|
| `"Incorrect PIN, try again"` | Attempt 1 | Show inline error |
| `"Incorrect PIN, you have 3 more attempts"` | Attempt 2 | Show inline message |
| `"Incorrect PIN, you have 2 more attempts"` | Attempt 3 | Show inline message |
| `"Incorrect PIN, you have 1 more attempt. Your account will be locked for 5 minutes if this fails"` | Attempt 4 | Show urgent warning |
| `"Account locked for 5 minutes"` | Attempt 5 or while locked | Show lockout screen |
| `"Account is not currently locked"` | Lockout expired before reset request | Hide reset button |
| `"Invalid or expired token"` | `temp_token` expired | Refresh token silently |
