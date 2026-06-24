# Frontend Implementation Prompt — Secure OAuth Consent Flow

## Context

The Google OAuth consent flow has been updated to remove PII from URLs. The backend no longer passes `email`, `firstName`, or `lastName` as plain query parameters. All consent data is now carried in a short-lived signed JWT token. The frontend must update three areas: the consent page redirect handler, a new data-fetch call, and the consent form submission.

The REST base URL is `http://localhost:4000`.

---

## What Changed

### Before

```
GET  /v1/students/auth/consent?email=...&firstName=...&lastName=...
POST /v1/students/auth/consent  body: { consent, email, firstName, lastName }
```

### After

```
GET  /v1/students/auth/consent?token=<jwt>        (redirect passthrough — no PII)
GET  /v1/students/auth/consent/info?token=<jwt>   (NEW — returns display data)
POST /v1/students/auth/consent  body: { consent, token }
```

---

## 1. OAuth Consent Landing Page (`/oauth/consent`)

The backend now redirects to:

```
STUDENT_URL/oauth/consent?token=<consentJWT>
```

instead of the old `?email=...&firstName=...&lastName=...` form.

**What to do:**

1. Read `token` from the URL query string — **do not read `email`, `firstName`, or `lastName`**.
2. Immediately `GET /v1/students/auth/consent/info?token=<token>` to fetch display data.
3. Render the consent UI with the returned values.
4. Store `token` in component state for the form submission — do **not** store it in `localStorage` or a cookie.

**Fetch example:**

```ts
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

const res = await fetch(`/api/v1/students/auth/consent/info?token=${token}`);
// 200: { email: string, firstName: string, lastName: string }
// 401: token is invalid or expired — redirect to /oauth/failed
const { email, firstName, lastName } = await res.json();
```

**Error handling:**

| Status | Action |
|--------|--------|
| `401`  | Token invalid or expired — redirect to `/oauth/failed` |
| `400`  | Token missing — redirect to `/oauth/failed` |
| Network error | Show "Something went wrong. Please try again." with a retry |

---

## 2. Consent Form Submission

The `POST /v1/students/auth/consent` body shape has changed. Remove all PII fields; send only `consent` and `token`.

**Old body:**
```json
{ "consent": "yes", "email": "...", "firstName": "...", "lastName": "..." }
```

**New body:**
```json
{ "consent": "yes", "token": "<consentJWT>" }
```

**Example:**

```ts
const res = await fetch('/api/v1/students/auth/consent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ consent, token }),   // token from step 1
});

const { redirectUrl } = await res.json();
window.location.href = redirectUrl;
```

**Error handling:**

| Status | Action |
|--------|--------|
| `201` with `redirectUrl` containing `/oauth/failed` | User declined — redirect to `/oauth/failed` |
| `201` with `redirectUrl` containing `/validate-account` | Account created — redirect to validate-account page |
| `401` | Token expired during consent (10-minute window) — show "Session expired. Please sign in again." and link back to Google login |
| `400` | Validation error — log and redirect to `/oauth/failed` |

---

## 3. Token Lifetime

The consent JWT expires in **10 minutes**. If the user takes longer than 10 minutes on the consent page, the `POST` will return `401`. Show a friendly expiry message and offer a "Sign in again" link.

---

## 4. Rate Limits

These endpoints are rate-limited. Handle `429 Too Many Requests` by showing "Too many attempts. Please wait a moment and try again." Do not retry automatically.

| Endpoint | Limit |
|----------|-------|
| `GET /auth/consent` | 20 req/min |
| `GET /auth/consent/info` | 20 req/min |
| `POST /auth/consent` | 5 req/min |

---

## 5. OAuth Redirect — Pending Deletion (unchanged)

The `GET /v1/students/auth/google/callback` redirect for deactivated accounts is unchanged. It still redirects to:

```
STUDENT_URL/oauth/redirect?token=<pendingDeletionJWT>&organizationId=...&accountStatus=PENDING_DELETION&deletionScheduledFor=...
```

Refer to `auth-flow-updates.md` for the full pending-deletion OTP flow.

---

## Summary of URL Query Params by Page

| Page | Params present | Notes |
|------|---------------|-------|
| `/oauth/consent` | `token` only | Fetch display data via `/consent/info` |
| `/oauth/redirect` (active) | `token`, `refreshToken`, `organizationId`, `isSetupCompleted` | Normal login — store tokens |
| `/oauth/redirect` (deactivated) | `token`, `organizationId`, `isSetupCompleted`, `accountStatus`, `deletionScheduledFor` | Pending-deletion flow |
| `/validate-account` | `email` | Account created but not yet verified |
| `/oauth/failed` | — | OAuth was declined or failed |
