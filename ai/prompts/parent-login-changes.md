# Frontend Implementation Prompt — Parent Login Changes

## Context

`loginParent` (the parent's own email/password login, not the child username/PIN login) previously had no per-account attempt limiting — only the shared per-IP rate limit applied. It now locks the account for 5 minutes after 3 consecutive wrong-password attempts, mirroring the protection already in place for child PIN login and (separately) student login.

Also affects `loginParent`: the "too many requests" error you may have seen as a raw `ThrottlerException: Too Many Requests` string is now a clean message — see §3.

**Affected frontend:** Parent portal (`localhost:3001`) — parent's own login screen (not the child login screen, which is covered in a separate prompt).

The GraphQL endpoint is `http://localhost:4000/graphql`.

---

## 1. `loginParent` — New 3-Attempt / 5-Minute Lockout

```graphql
mutation LoginParent($input: LoginParentInput!) {
  loginParent(input: $input) {
    token
    refresh_token
    id
    email
    first_name
    last_name
    account_status
    deletion_scheduled_for
  }
}
```

```graphql
input LoginParentInput {
  email: String!
  password: String!
}
```

Mutation signature is unchanged — this is purely new server-side attempt tracking.

### Error behavior

The first two wrong-password attempts do **not** reveal a remaining-attempts count — this is intentional, to avoid handing an attacker a live counter against a specific email address. You'll see the same message on attempt 1 and attempt 2:

| Attempt # | `error.message` |
|-----------|----------------|
| 1st wrong | `"Email or password is incorrect"` |
| 2nd wrong | `"Email or password is incorrect"` |
| 3rd wrong (locks) | `"Too many failed attempts. Your account is locked for 5 minutes. Please try again later or contact support."` |
| While locked | `"Too many failed attempts. Your account is locked for 5 minutes. Please try again later or contact support."` |

Do **not** build a "2 attempts remaining" style UI here — there is no attempt count surfaced to the client for the first two failures. Just show the existing generic error inline until the lockout message appears.

### Non-credential failures do not count toward lockout

`"Account not verified. Please check your email for the verification code."` and `"This account no longer exists."` are account-state errors, not wrong-password guesses. They do **not** consume one of the 3 attempts and cannot trigger a lockout. Keep handling these exactly as you do today — no changes needed for these two messages.

### Lockout UI

A disabled form + inline message + countdown is sufficient (no separate full-screen takeover is required, but feel free to reuse the child-lockout screen pattern if you'd like visual consistency):

```
┌─────────────────────────────────────────────────────────┐
│  🔒  Too many failed attempts                            │
│                                                         │
│  Your account is locked for 5 minutes.                  │
│  Please try again later or contact support.              │
│                                                         │
│  [Countdown timer: 4:59 ...]                             │
└─────────────────────────────────────────────────────────┘
```

**Timer:** Start a client-side 5-minute countdown the moment you receive the locked message. No server polling needed. When it reaches zero, re-enable the form and let the user try again.

**No "contact support" link/email exists yet** in this codebase — the message tells the user to contact support, but there's currently no dedicated support contact surface (email, chat, form) wired up on the backend. Until product defines one, either point this at whatever general contact channel already exists elsewhere in the app, or simply leave it as a text instruction without a clickable action.

---

## 2. GraphQL Error Shape Reference

Errors arrive as structured `UnauthorizedException` payloads. In non-production, `extensions.originalError` carries the full object:

```json
{
  "message": "Too many failed attempts. Your account is locked for 5 minutes. Please try again later or contact support.",
  "extensions": {
    "code": "UNAUTHORIZED",
    "originalError": {
      "message": "...",
      "code": "ACCOUNT_LOCKED",
      "locked_at": "2026-07-11T13:00:00.000Z"
    }
  }
}
```

In production, only `error.message` and the outer `extensions.code` (`UNAUTHORIZED`) are guaranteed — `originalError` is stripped. **Match on `error.message` string**, not on the inner `code`/`locked_at` fields, since those aren't available in prod.

| `message` | Meaning |
|-----------|---------|
| `"Email or password is incorrect"` | Attempts 1–2 |
| `"Too many failed attempts. Your account is locked for 5 minutes. Please try again later or contact support."` | Locked (3rd attempt or already locked) |
| `"Account not verified. Please check your email for the verification code."` | Account-state, not a credential guess |
| `"This account no longer exists."` | Account-state, not a credential guess |

This does not affect the existing pending-deletion / cancellation-OTP flow on successful login (`account_status: PENDING_DELETION`) — that behavior is unchanged.

---

## 3. Rate-Limit ("Too Many Requests") Error Now Clean

Previously, hitting the per-IP `@Throttle` rate limit on `loginParent` (or any other throttled mutation in the app) returned the raw NestJS exception text:

```
"ThrottlerException: Too Many Requests"
```

with no `extensions.code`. This is now a proper GraphQL error:

```json
{
  "message": "Too many requests. Please wait a moment and try again.",
  "extensions": { "code": "TOO_MANY_REQUESTS" }
}
```

If you had a UI branch matching the old raw string (or silently swallowing an unrecognized error shape), update it to match on `extensions.code === 'TOO_MANY_REQUESTS'` (preferred) or the new message text. This applies to every throttled mutation across the app, not just `loginParent`.

---

## 4. State Management Checklist

- [ ] Add a disabled-form + 5-minute countdown state to the parent login screen for the lockout case
- [ ] Do not build an "attempts remaining" indicator here — it's not provided for the first two failures
- [ ] Ensure "not verified" / "account no longer exists" errors keep their existing distinct handling (unaffected by lockout)
- [ ] Ensure the pending-deletion / cancel-OTP flow after a successful login is unaffected
- [ ] Add/verify a UI branch for `extensions.code === 'TOO_MANY_REQUESTS'` on `loginParent` and any other throttled call, replacing any handling of the old raw `ThrottlerException` string
