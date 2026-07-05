# Frontend Integration Prompt — Test Timer Migration (SSE → Client-Side Countdown)

## Context

The backend previously ended a student's test using an in-memory timer that pushed
per-second updates to the frontend over Server-Sent Events (SSE). That mechanism
has been removed entirely: it wasn't durable (a backend restart lost all in-flight
timers) and it wasn't reliable (a test only auto-ended if a client's SSE connection
was open when the deadline hit).

The backend now schedules a durable, queued job to end a test at the exact
deadline, independent of any client connection. The frontend no longer receives
any server push for timing — it must compute the countdown locally from data the
backend already returns (`time_events` + each question's `estimated_time_in_ms`),
and resync that computation from a new `activeTest` query whenever the test-taking
screen mounts or reloads.

This document is the complete integration specification for the frontend team.

---

## Overview

1. **Remove all EventSource/SSE integration code.** The following endpoints no
   longer exist and will 404:
   - `GET /tests/:testId/:studentId/stream`
   - `GET /tests/:studentId/stream`
   Delete any `new EventSource(...)` usage, related event listeners, and any
   state that was populated from `time_update`/`test_ended`/`test_paused`/
   `test_resumed` SSE messages.
2. **On the test-taking screen's mount (including page reload), call the
   existing `getActiveTest` query** to fetch the current test plus
   `time_events` and `test_suite.questions`, then run the countdown formula
   below to compute the remaining time. Don't trust any client-cached timer
   state across reloads — always resync from this query. (This query already
   existed for other purposes; it is now also the replacement for the deleted
   SSE reconnection flow — no new query was added.)
3. **Compute the countdown client-side** using the formula below — a plain
   local interval, no per-tick network calls.
4. **Handle the new `TEST_ENDED` error code** on `submitAnswer` — the backend's
   queue may end a test the client doesn't yet know about (e.g. a backgrounded
   tab), and this is the safety net for that case.

---

## GraphQL Endpoint

```
POST http://localhost:4000/graphql          # development
POST https://api.examforge.com/graphql     # production
```

All mutations/queries require a valid JWT in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## Queries

### 1. Get Active Test (existing query — now also your resync point)

`getActiveTest` already exists in the schema (used by other parts of the app);
it now doubles as the replacement for the deleted SSE reconnection flow. Call
it whenever the test-taking screen mounts (including on reload) to resync the
countdown from server truth.

```graphql
query GetActiveTest {
  getActiveTest {
    id
    status
    mode
    time_events {
      type
      recorded_at
    }
    test_suite {
      id
      questions {
        id
        estimated_time_in_ms
      }
    }
  }
}
```

**Success response — student has an active test:**
```json
{
  "data": {
    "getActiveTest": {
      "id": "test-uuid",
      "status": "ON_GOING",
      "mode": "PROCTURED",
      "time_events": [
        { "type": "STARTED", "recorded_at": "2026-07-05T10:00:00.000Z" }
      ],
      "test_suite": {
        "id": "suite-uuid",
        "questions": [{ "id": "q1", "estimated_time_in_ms": 60000 }]
      }
    }
  }
}
```

**Possible errors:**

| HTTP-equivalent | `message` | When |
|---|---|---|
| 404 Not Found | `"Student not found"` | JWT references an unknown user |
| 404 Not Found | `"No active test found"` | Student has no `ON_GOING`/`PAUSED` test — show the "start a test" UI in this case, don't treat it as a hard error |

Note this query **throws** rather than returning `null` when there's no active
test — catch the `NOT_FOUND` case explicitly rather than checking for a falsy
result.

---

## Mutations (existing — signatures unchanged)

`startTest`, `pauseTest`, `resumeTest`, `endTest`, `submitAnswer`,
`startAssignedTest` all keep their existing GraphQL signatures and return
shapes. No fields were added or removed from any of these mutations. The only
behavioral change is that `submitAnswer` can now reject with the new
`TEST_ENDED` error code (see below) — this can happen even if the client never
called `endTest` itself, since the backend queue may have auto-ended the test
while the client was inactive.

---

## Client-Side Countdown Formula

Given the `time_events` array (each with `type`: `STARTED` | `PAUSED` |
`RESUMED` | `ENDED`, and `recorded_at`) and `test_suite.questions`, compute the
deadline exactly as the backend does:

```
totalEstimatedMs = sum(test_suite.questions[].estimated_time_in_ms)

sortedEvents = time_events sorted ascending by recorded_at

# timeUsedMs: total *active* time elapsed so far, excluding paused gaps
startedEvent = first event with type STARTED
lastActiveTime = startedEvent.recorded_at
timeUsedMs = 0
for event in sortedEvents[1:]:
  if event.type == PAUSED:
    timeUsedMs += event.recorded_at - lastActiveTime
    lastActiveTime = null   # stop tracking while paused
  else if event.type == RESUMED:
    lastActiveTime = event.recorded_at
if lastActiveTime is not null:
  timeUsedMs += now() - lastActiveTime   # still active, count up to now

# endTime: when the last event is RESUMED, the deadline shifts by time already
# used; otherwise (never paused) it's simply start + total estimate
lastEvent = sortedEvents[last]
if lastEvent.type == RESUMED:
  endTime = lastEvent.recorded_at + totalEstimatedMs - timeUsedMs
else:
  endTime = startedEvent.recorded_at + totalEstimatedMs

remainingMs = endTime - now()
```

If `status === "PAUSED"`, **freeze the displayed remaining time** at the value
computed at the moment of pause — don't keep counting down while paused (there
won't be a trailing `RESUMED` event yet, so the formula's `else` branch
naturally returns a fixed `endTime` in this case; just stop your local
`setInterval` while paused).

**Worked example:**
- `totalEstimatedMs` = 120,000 (two questions, 60,000ms each)
- `time_events`: `STARTED` at `10:00:00`, `PAUSED` at `10:00:30`, `RESUMED` at
  `10:05:00`
- `timeUsedMs` = 30,000 (the 30s of active time between `STARTED` and `PAUSED`;
  the 4m30s pause gap doesn't count)
- Last event is `RESUMED` at `10:05:00`, so
  `endTime = 10:05:00 + 120,000ms - 30,000ms = 10:06:30`
- If "now" is `10:05:10`, `remainingMs = 80,000` (1m20s remaining)

Implement the local ticking timer as a plain `setInterval`/
`requestAnimationFrame` counting down from `endTime`, computed once on mount
(and recomputed only when `getActiveTest` is re-queried or a pause/resume
mutation completes) — no network call per tick.

---

## Error Handling Pattern

Errors come back as GraphQL errors, not HTTP 4xx:

```json
{
  "errors": [
    {
      "message": "<human-readable message>",
      "extensions": { "code": "TEST_ENDED" | "SUBSCRIPTION_REQUIRED" | "..." }
    }
  ]
}
```

| code | meaning | UI behavior |
|---|---|---|
| `TEST_ENDED` | `submitAnswer` called after the test has already ended (possibly auto-ended by the backend queue while the client was unaware) | Show a "this test has ended" modal, redirect to the results/`testStats` screen, do **not** retry the submission |
| `SUBSCRIPTION_REQUIRED` | existing code, unchanged | existing handling |

---

## UI/UX Requirements

- Remove any `EventSource`/SSE client code entirely — there is nothing to
  connect to anymore.
- On mount of the test-taking screen, call `getActiveTest` first. If it
  returns a test with `status` `ON_GOING` or `PAUSED`, resync the local
  countdown from the formula above using that response — never trust a
  client-cached timer value across a reload. If it throws `NOT_FOUND`, show
  the "start a test" UI instead.
- The local timer is a simple client-side interval computed once from
  `endTime`; do not poll the backend per tick.
- **Recommended:** when the local countdown reaches zero, proactively call the
  `endTest` mutation for the best UX (immediate transition to results). Also
  handle `TEST_ENDED` on `submitAnswer` as the safety net for cases where the
  tab was backgrounded/inactive and the backend's queue already auto-ended the
  test first — both paths are expected to occur and should be handled
  gracefully.

---

## Manual Verification (Dev/Staging Only)

The backend team can verify the end-to-end auto-end/queue behavior directly
(seeding a short-duration test suite, inspecting the `end-test-queue` in Redis,
etc.) — see the backend's own test-timer migration plan for that procedure.
From the frontend side, the simplest manual check is: start a test with a
short suite, background the tab past the deadline, bring it back, and confirm
`submitAnswer`/`getActiveTest` reflect `ENDED` status without the frontend
having called `endTest` itself.
