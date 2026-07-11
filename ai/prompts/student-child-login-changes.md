# Frontend Implementation Prompt — Student & Child Login Changes

## Context

Two login flows changed on the backend:

1. **Child login is now a single call.** The old two-step flow (`verifyChildUsername` → `temp_token` → `loginChild(temp_token, pin)`) has been removed. `loginChild` now takes `username` and `pin` directly in one call. `verifyChildUsername` no longer exists — remove any calls to it.
2. **Student login (`loginStudent`) now has a 3-attempt / 5-minute account lockout**, matching the protection child PIN login already had (previously only per-IP rate limiting applied — no per-account lockout existed for student password login).

Also affects both flows: the "too many requests" error you may have seen as a raw `ThrottlerException: Too Many Requests` string is now a clean message — see §4.

**Affected frontend:** Student portal (`localhost:3000`) — email/password login screen. Parent portal (`localhost:3001`) — child username/PIN login screen.

The GraphQL endpoint is `http://localhost:4000/graphql`.

---

## 1. Child Login — Now a Single Mutation

### Old flow (remove this)

```
Step 1 — verifyChildUsername(username) → temp_token
Step 2 — loginChild(temp_token, pin) → token + refresh_token
```

`verifyChildUsername` and the `VerifyChildUsernameInput`/`VerifyChildUsernameResponse` types no longer exist in the schema. Remove the intermediate step entirely.

### New flow

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

```graphql
input LoginChildInput {
  username: String!
  pin: String!
}
```

Collect both `username` and `pin` on the same screen and submit them together in one call — there's no longer a reason to split them across two steps/screens.

### Unknown username no longer gets a distinct error

Previously an unknown username returned `"Username not found"` from `verifyChildUsername`, distinguishable from a wrong PIN. **This distinction is gone by design** (it was a username-enumeration leak). A wrong username and a wrong PIN now both return the same generic message:

```
"Username or PIN is incorrect"
```

Do not attempt to tell the user which field was wrong — show this message generically under the form, not attached to a specific field.

### PIN attempt/lockout messaging — unchanged

The 5-attempt PIN lockout behavior and its exact messages are unchanged from before, just reached via the single call instead of step 2 of the old flow:

| Attempt # | `error.message` |
|-----------|----------------|
| 1st wrong | `"Incorrect PIN, try again"` |
| 2nd wrong | `"Incorrect PIN, you have 3 more attempts"` |
| 3rd wrong | `"Incorrect PIN, you have 2 more attempts"` |
| 4th wrong | `"Incorrect PIN, you have 1 more attempt. Your account will be locked for 5 minutes if this fails"` |
| 5th wrong | `"Account locked for 5 minutes"` |
| While locked | `"Account locked for 5 minutes"` |

Show the lockout screen and countdown timer exactly as before (see the existing `child-login-pin-lockout.md` prompt for the full lockout screen spec — that UX is unaffected by this change).

### `requestChildPinReset` now takes `username`, not `temp_token`

```graphql
mutation RequestChildPinReset($input: RequestChildPinResetInput!) {
  requestChildPinReset(input: $input)
}
```

```graphql
input RequestChildPinResetInput {
  username: String!
}
```

Since there's no more `temp_token` in the flow, pass the `username` the child already typed on the login screen. There is no token-expiry concern anymore — drop any "refresh the temp_token if expired" handling you may have built for this button.

---

## 2. Student Login — New 3-Attempt / 5-Minute Lockout

`loginStudent` (email + password) previously had no per-account attempt limiting, only the shared per-IP rate limit. It now locks the account for 5 minutes after 3 consecutive wrong-password attempts.

```graphql
query LoginStudent($email: String!, $password: String!) {
  loginStudent(email: $email, password: $password) {
    token
    refresh_token
    id
    email
    name
  }
}
```

(Signature unchanged — still two plain arguments, not an input type.)

### Error behavior — different from child PIN

Unlike the child PIN flow, **the first two wrong-password attempts do not reveal a remaining-attempts count**. This is intentional — it avoids handing an attacker a live counter against a specific email address. You'll see the same message on attempt 1 and attempt 2:

| Attempt # | `error.message` |
|-----------|----------------|
| 1st wrong | `"Email or password is incorrect"` |
| 2nd wrong | `"Email or password is incorrect"` |
| 3rd wrong (locks) | `"Too many failed attempts. Your account is locked for 5 minutes. Please try again later or contact support."` |
| While locked | `"Too many failed attempts. Your account is locked for 5 minutes. Please try again later or contact support."` |

Because there's no attempt counter surfaced to the client, **do not build a "2 attempts remaining" style UI for student login** — you can't know the count without it being told to you, and it deliberately isn't. Just show the generic error inline until the lockout message appears.

### Non-credential failures do not count toward lockout

`"Account not verified. Please check your email for the verification code."` and `"This account no longer exists."` are account-state errors, not wrong-password guesses — they do **not** consume one of the 3 attempts and do **not** risk triggering a lockout. Keep handling these exactly as you do today; nothing changes for these two messages.

### Lockout screen

There's no `temp_token`/PIN-input concept for student login, so a full lockout screen isn't required — a disabled form + inline message is sufficient:

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

**Timer:** Same pattern as child lockout — start a client-side 5-minute countdown the moment you receive the locked message. No server polling needed. When it reaches zero, re-enable the form and let the user try again.

**No "contact support" link/email exists yet** in this codebase — the message tells the user to contact support, but there's currently no dedicated support contact surface (email, chat, form) wired up on the backend. Until product defines one, either point this at whatever general contact channel already exists elsewhere in the app, or simply leave it as a text instruction without a clickable action.

---

## 3. GraphQL Error Shape Reference

Errors for both flows arrive as structured `UnauthorizedException` payloads. In non-production, `extensions.originalError` carries the full object:

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

In production, only `error.message` and `extensions.code` (the outer HTTP-exception code, e.g. `UNAUTHORIZED`) are guaranteed — `originalError` is stripped. **Match on `error.message` string, not on the inner `code`/`locked_at` fields**, since those aren't available in prod. This matches the existing convention from the child PIN flow.

| `message` | Meaning |
|-----------|---------|
| `"Username or PIN is incorrect"` | Child login: unknown username or wrong PIN (indistinguishable by design) |
| `"Incorrect PIN, ..."` variants | Child login: PIN attempts 1–4 (see table in §1) |
| `"Account locked for 5 minutes"` | Child login: locked (5th PIN attempt or already locked) |
| `"Email or password is incorrect"` | Student login: attempts 1–2 |
| `"Too many failed attempts. Your account is locked for 5 minutes. Please try again later or contact support."` | Student login: locked (3rd attempt or already locked) |
| `"Account not verified. Please check your email for the verification code."` | Student login: account-state, not a credential guess |
| `"This account no longer exists."` | Student login: account-state, not a credential guess |

---

## 4. Rate-Limit ("Too Many Requests") Error Now Clean

Previously, hitting the per-IP `@Throttle` rate limit on any of these mutations/queries returned the raw NestJS exception text:

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

If you had a UI branch matching the old raw string (or silently swallowing an unrecognized error shape), update it to match on `extensions.code === 'TOO_MANY_REQUESTS'` (preferred) or the new message text. This applies to every throttled mutation across the app — `loginChild`, `loginParent`, `loginStudent`, `requestChildPinReset`, registration, password reset requests, etc. — not just the flows in this document.

---

## 5. State Management Checklist

- [ ] Remove `verifyChildUsername` call and any `temp_token` state from the child login flow; submit `username` + `pin` together in one `loginChild` call
- [ ] Update `requestChildPinReset` to send `username` instead of `temp_token`; remove any temp-token-refresh-before-reset-request logic
- [ ] Treat "unknown username" and "wrong PIN" as the same generic error on the child login screen
- [ ] Add a disabled-form + 5-minute countdown state to the student login screen for the lockout case
- [ ] Do not build an "attempts remaining" indicator for student login — it's not provided
- [ ] Add/verify a UI branch for `extensions.code === 'TOO_MANY_REQUESTS'` on all throttled calls, replacing any handling of the old raw `ThrottlerException` string
