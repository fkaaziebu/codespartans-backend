# CodeSpartans Backend

NestJS + GraphQL API backend for the CodeSpartans platform.

## Tech Stack

- **Framework:** NestJS 10 (TypeScript)
- **API:** GraphQL (Apollo Server 5) — code-first schema generation
- **Database:** PostgreSQL via TypeORM 0.3
- **Cache/Queue:** Redis + BullMQ
- **Search:** MeiliSearch
- **Auth:** JWT + Passport (Google OAuth 2.0)
- **Email:** Nodemailer

## Commands

```bash
# Development
npm run start:dev       # Dev server with watch (port 4000)

# Production
npm run build           # Compile TypeScript to dist/
npm run start:prod      # Run compiled build

# Tests
npm run test            # Unit tests
npm run test:watch      # Watch mode
npm run test:cov        # With coverage
npm run test:e2e        # End-to-end tests

# Code quality
npm run lint            # ESLint with auto-fix
npm run format          # Prettier format src/ and test/
```

## Project Structure

```
src/
├── main.ts                  # Bootstrap: creates databases, configures CORS
├── app.module.ts            # Root module with GraphQL & feature imports
├── config.schema.ts         # Joi schema validating all required env vars
├── database/
│   ├── database.provider.ts # PostgreSQL & Redis connection setup
├── modules/                 # Feature modules (NestJS modular architecture)
│   ├── auth/                # JWT + Google OAuth strategies
│   ├── inventory/           # Course management
│   ├── media/               # File/media handling
│   ├── parent/              # Parent portal features
│   ├── simulation/          # Test/exam simulation
│   └── school/
├── helpers/
│   ├── types/               # GraphQL type definitions
│   ├── guards/              # Auth guards
│   ├── strategies/          # Passport strategies
│   └── inputs/              # GraphQL input types
└── setup-db.service.ts      # Database initialization & seeding
```

## Environment Variables

Copy `.env.example` to `.env.development.local` (dev) or `.env.prod.local` (prod):

```env
PORT=4000
STAGE=development

# Database
DB_USERNAME=
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432
DB_NAME=codespartans
DB_NAME_TEST=codespartans_test

# Redis
REDIS_URL=redis://default:password@localhost:6379

# Auth
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_SECRET=
GOOGLE_CALLBACK_URL=

# Email
GMAIL_USER=
GMAIL_APP_PASSWORD=
EMAIL_FROM=
EMAIL_HOST=

# Search
MEILI_URL=http://localhost:7700
MEILI_MASTER_KEY=
MEILI_INDEX=codespartans

# Payments
PAYSTACK_SECRET_KEY=

# Frontend redirect URLs
STUDENT_URL=http://localhost:3000
PARENT_URL=http://localhost:3001
```

## Infrastructure (Docker)

```bash
docker-compose up        # Start PostgreSQL, Redis, MeiliSearch
```

Services:
- **PostgreSQL:** port 5432 — auto-created by `main.ts` on startup
- **Redis:** port 6379 — BullMQ queues and caching
- **MeiliSearch:** port 7700 — full-text search

## GraphQL

- **Endpoint:** `http://localhost:4000/graphql`
- **Schema:** Auto-generated from decorators (code-first approach)
- **Playground:** Enabled in development (introspection on)

## Conventions

- NestJS modular architecture — one directory per feature under `src/modules/`
- GraphQL resolvers use `@Resolver()`, `@Query()`, `@Mutation()` decorators
- DTOs and input types live in `helpers/inputs/`
- Auth guards (`@UseGuards(JwtAuthGuard)`) protect resolvers
- BullMQ workers are defined alongside their module (e.g., `email.processor.ts`)
- TypeORM entities use decorator-based schema definition

## Testing

- Unit tests live alongside source files (`*.spec.ts`)
- E2E tests in `test/` directory using `jest-e2e.json` config
- Tests use a separate database (`DB_NAME_TEST`)
