# School Module

## Overview

The school module gives a school organization the ability to manage its enrolled students — adding them one at a time or in bulk, resetting PINs, and sharing login details. It mirrors the parent module in structure: where a parent manages children, the school (organization) manages school students.

---

## Analogy: Parent vs School

| Concept | Parent Module | School Module |
|---|---|---|
| Account owner | `Parent` entity | `Organization` entity (already exists) |
| Managed learner | `Child` entity | `SchoolStudent` entity |
| Account auth | JWT `role: PARENT` | JWT `role: ORGANIZATION` |
| Learner auth | JWT `role: CHILD` | JWT `role: STUDENT` |
| Login flow | `verifyChildUsername` → `loginChild` | `verifySchoolStudentUsername` → `loginSchoolStudent` |
| Bulk setup | `setupParentAccount` | `bulkEnrollStudents` |

The school does **not** register separately — it is already an `Organization` created either via `registerOrganization` or `activateSchoolDemo`.

---

## Student Lifecycle

```
School (ORGANIZATION) calls addSchoolStudent / bulkEnrollStudents
       ↓
SchoolStudent record created  +  Student record created
  (username, hashed PIN, class_level, target_exam)
       ↓
School shares login details with student (username + raw PIN)
       ↓
Student calls verifySchoolStudentUsername(username)
  → receives short-lived temp_token (5 min)
       ↓
Student calls loginSchoolStudent(temp_token, pin)
  → receives JWT { role: STUDENT } + refresh_token
       ↓
Student uses the platform (SubscriptionGuard checks org access)
       ↓
School can reset PIN, share login again, or remove student
```

---

## Entities

### `SchoolStudent` (`src/modules/school/entities/school-student.entity.ts`)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `full_name` | string | Student's full name |
| `class_level` | enum `ClassLevel` | JHS1–SHS3 (shared with parent module) |
| `target_exam` | UUID | References a `Category` (exam target) |
| `username` | string (unique) | Auto-generated `firstname.lastname##` |
| `pin` | string | Hashed 6-digit PIN — **not exposed via GraphQL** |
| `organization` | `Organization` | ManyToOne — the school that enrolled them |
| `student` | `Student` | OneToOne — the underlying student record |

The linked `Student` record uses `username@student.local` as its email and the raw PIN as its password (hashed). This allows the student to be checked by `SubscriptionGuard` (which looks at `student.organizations`).

---

## API Reference

### Org-Authenticated Endpoints (require ORGANIZATION JWT)

| Operation | Type | Description |
|---|---|---|
| `listSchoolStudents(searchTerm?, pagination?)` | Query | Paginated list of enrolled students |
| `addSchoolStudent(input)` | Mutation | Enroll a single student; returns the raw PIN once |
| `bulkEnrollStudents(input)` | Mutation | Enroll multiple students; returns array of `{ full_name, username, pin }` |
| `resetStudentPin(studentId)` | Mutation | Generate and return a new PIN |
| `shareStudentLogin(studentId)` | Mutation | Resets PIN and returns a formatted login message |
| `removeSchoolStudent(studentId)` | Mutation | Removes the student from the school and unlinks the org from their student record |

### Public Endpoints (no auth required)

| Operation | Type | Description |
|---|---|---|
| `verifySchoolStudentUsername(username)` | Mutation | Verifies the username exists; returns a 5-minute `temp_token` |
| `loginSchoolStudent(input)` | Mutation | Exchanges `temp_token + pin` for a full JWT and refresh token |

---

## GraphQL Examples

**Enroll a single student:**
```graphql
mutation {
  addSchoolStudent(input: {
    full_name: "Kofi Mensah"
    class_level: SHS2
    target_exam: "category-uuid-here"
  }) {
    message
    pin
  }
}
```

**Bulk enroll:**
```graphql
mutation {
  bulkEnrollStudents(input: {
    students: [
      { full_name: "Ama Boateng", class_level: JHS3, target_exam: "uuid" }
      { full_name: "Kweku Asante", class_level: SHS1, target_exam: "uuid" }
    ]
  }) {
    full_name
    username
    pin
  }
}
```

**Student login (two-step):**
```graphql
# Step 1 — verify username
mutation {
  verifySchoolStudentUsername(username: "kofi.mensah42") {
    temp_token
  }
}

# Step 2 — enter PIN
mutation {
  loginSchoolStudent(input: { temp_token: "...", pin: "391847" }) {
    token
    refresh_token
    full_name
    username
  }
}
```

---

## Input Types

### `AddSchoolStudentInput`
```
full_name: String!
class_level: ClassLevel!   # JHS1 | JHS2 | JHS3 | SHS1 | SHS2 | SHS3
target_exam: String!       # Category UUID (the exam the student is preparing for)
```

### `BulkEnrollStudentsInput`
```
students: [AddSchoolStudentInput!]!
```

### `LoginSchoolStudentInput`
```
temp_token: String!
pin: String!
```

---

## Username Generation

Usernames follow the same pattern as the parent module's children:

1. Split `full_name` into parts (lowercase, trimmed)
2. Combine as `firstname.lastname`
3. Append a random 2-digit suffix (`##`)
4. Check uniqueness against the `school_students` table
5. Retry with a different suffix if taken

Example: `"Kofi Mensah"` → `"kofi.mensah73"`

---

## PIN Management

- PINs are **6-digit numeric strings** generated with `Math.random()`
- Stored **hashed** (bcrypt) in both `SchoolStudent.pin` and `Student.password`
- The raw PIN is returned **once** at enrollment; after that, use `resetStudentPin`
- `shareStudentLogin` regenerates the PIN (invalidates the old one) and returns a pre-formatted message string for the school to send to the student/parent via WhatsApp or SMS

---

## SubscriptionGuard Integration

When a school student logs in they receive a JWT with `role: STUDENT`. Their `Student` record has `organizations: [<their school>]`.

The `SubscriptionGuard` (see `src/helpers/guards/subscription.guard.ts`) checks this automatically:
- Finds the student's linked organizations
- Verifies the org has an active demo or active paid subscription
- Blocks gated endpoints (`startTest`, `listOrganizationCourses`, etc.) if access has lapsed

No changes to the `SubscriptionGuard` are needed to support school students.

---

## File Map

```
src/modules/school/
├── school.module.ts
├── entities/
│   └── school-student.entity.ts      # SchoolStudent (ManyToOne Org, OneToOne Student)
├── inputs/
│   ├── add-school-student.input.ts   # { full_name, class_level, target_exam }
│   ├── bulk-enroll-students.input.ts # { students: [AddSchoolStudentInput] }
│   └── login-school-student.input.ts # { temp_token, pin }
├── resolvers/
│   └── school.resolver.ts
├── services/
│   └── school.service.ts
└── types/
    ├── index.ts
    ├── add-student-response.type.ts          # { message, pin }
    ├── enroll-student-result.type.ts         # { full_name, username, pin }
    ├── login-school-student-response.type.ts # extends SchoolStudent + { token, refresh_token }
    ├── school-student-connection.type.ts     # cursor-paginated SchoolStudent list
    └── verify-student-username-response.type.ts  # { temp_token }
```

---

## Planned Work

### Student Progress Views (Phase 2)

Add org-level queries to give the school admin visibility into how students are performing — mirroring what the parent module provides for children:

| Query | Description |
|---|---|
| `getSchoolStudentStats(studentId)` | Avg score, streak, total questions, sessions this week |
| `getSchoolStudentSubjectProgress(studentId)` | Per-subject accuracy |
| `getSchoolStudentTestHistory(studentId, pagination)` | Paginated list of ended tests with scores |
| `getSchoolStudentWeakAreas(studentId)` | Subjects with accuracy ≤ 65% |
| `getSchoolStudentActivity(studentId, pagination)` | Activity feed |
| `getSchoolStudentStreak(studentId)` | Current and best streak |
| `listSchoolStudentStreak(studentId, month, year)` | Monthly streak calendar |

The implementation follows the exact same pattern as `ParentService.getChildStats`, `getChildSubjectProgress`, etc. — query the linked `Student.tests` with the appropriate relations.

### Class-Based Organization (Phase 2)

Allow students to be grouped into classes within the school:

- New `SchoolClass` entity: `{ id, name, class_level, organization }`
- `SchoolStudent.school_class: ManyToOne → SchoolClass`
- New mutations: `createSchoolClass`, `assignStudentToClass`, `listClassStudents`

### WhatsApp/SMS Login Sharing (Phase 2)

`shareStudentLogin` currently returns a message string. Wire it to the `WhatsappService` (once integrated) to send the credentials directly to the student's parent via WhatsApp instead of requiring the school admin to copy-paste.

### Bulk Import via CSV (Phase 3)

Allow schools to upload a CSV file with student data for large cohort enrollment, rather than sending individual GraphQL mutations.
