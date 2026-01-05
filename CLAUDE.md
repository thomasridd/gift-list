# CLAUDE.md - AI Assistant Guide for Gift List Codebase

This document provides comprehensive guidance for AI assistants working with the Gift List application codebase.

## Table of Contents
- [Project Overview](#project-overview)
- [Repository Structure](#repository-structure)
- [Technology Stack](#technology-stack)
- [Development Workflow](#development-workflow)
- [Code Architecture & Patterns](#code-architecture--patterns)
- [Key Conventions](#key-conventions)
- [Environment Configuration](#environment-configuration)
- [Common Development Tasks](#common-development-tasks)
- [Testing Strategy](#testing-strategy)
- [Deployment Process](#deployment-process)
- [Important Notes for AI Assistants](#important-notes-for-ai-assistants)

---

## Project Overview

**Gift List** is a full-stack Christmas gift coordination web application that enables authenticated users (listers) to create and manage gift lists while allowing anonymous users (gifters) to claim gifts via shareable URLs.

### Key Features
- **For Listers**: Create/manage lists, add/edit/delete/reorder gifts, view claims, generate shareable URLs
- **For Gifters**: Browse lists via share URLs, claim gifts with messages (no login required)

### Architecture
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS (deployed on Netlify)
- **Backend**: AWS Lambda (Node.js 20) + API Gateway
- **Database**: DynamoDB (single-table design)
- **Auth**: AWS Cognito (JWT-based)
- **Infrastructure**: Terraform (IaC)
- **Deployment**: Gitflow with `dev` and `prod` branches

---

## Repository Structure

```
gift-list/
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          # Login, ProtectedRoute
│   │   │   ├── common/        # Reusable UI (Button, Card, Modal, Layout)
│   │   │   ├── gifter/        # Public views (PublicListView, ClaimModal)
│   │   │   └── lister/        # Authenticated views (Dashboard, GiftManager, forms)
│   │   ├── hooks/             # useAuth, useQueries
│   │   ├── services/          # api.ts (Axios), auth.ts (Cognito)
│   │   ├── types/             # TypeScript interfaces
│   │   ├── App.tsx            # Route definitions
│   │   └── main.tsx           # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── backend/                    # Lambda API
│   ├── src/
│   │   ├── handlers/          # Route handlers (lists.ts, gifts.ts, public.ts)
│   │   ├── services/          # Business logic (dynamodb.ts, validation.ts)
│   │   ├── middleware/        # auth.ts (JWT verification)
│   │   ├── utils/             # response.ts, crypto.ts
│   │   ├── types/             # TypeScript interfaces
│   │   └── index.ts           # Main Lambda handler with route mapping
│   ├── package.json
│   └── tsconfig.json
│
├── terraform/                  # Infrastructure as Code
│   ├── main.tf                # Provider config
│   ├── variables.tf           # Variable definitions
│   ├── outputs.tf             # Output values
│   ├── dynamodb.tf            # DynamoDB table
│   ├── cognito.tf             # User pool
│   ├── lambda.tf              # Lambda function
│   ├── api-gateway.tf         # API Gateway + routes
│   └── environments/
│       ├── dev.tfvars         # Dev environment config
│       └── prod.tfvars        # Prod environment config
│
├── .github/
│   └── workflows/
│       ├── ci.yml             # CI checks
│       └── deploy.yml         # Automated deployment
│
├── netlify.toml               # Netlify config with gitflow contexts
├── PROMPT.md                  # Full technical specification
└── README.md                  # User-facing documentation
```

---

## Technology Stack

### Frontend
- **React 18**: UI library
- **TypeScript 5.3**: Type safety
- **Vite**: Build tool (fast HMR, optimized builds)
- **Tailwind CSS 3**: Utility-first styling
- **React Query (@tanstack/react-query)**: Server state management, caching
- **React Router 6**: Client-side routing
- **React Hook Form + Zod**: Form validation
- **AWS Amplify (Cognito)**: Authentication (amazon-cognito-identity-js)
- **Axios**: HTTP client
- **@dnd-kit**: Drag-and-drop for gift reordering
- **@headlessui/react**: Accessible UI primitives
- **@heroicons/react**: Icons
- **react-hot-toast**: Toast notifications

### Backend
- **Node.js 20**: Runtime
- **TypeScript 5.3**: Type safety
- **AWS Lambda**: Serverless compute
- **AWS SDK v3**: DynamoDB client
- **Zod**: Runtime validation
- **uuid**: ID generation

### Infrastructure
- **Terraform 1.6+**: IaC
- **AWS DynamoDB**: NoSQL database
- **AWS Cognito**: User authentication
- **AWS API Gateway**: HTTP API
- **AWS Lambda**: Serverless functions
- **Netlify**: Frontend hosting/CDN

### Development Tools
- **ESLint**: Linting
- **Jest**: Testing (configured but tests not yet implemented)
- **GitHub Actions**: CI/CD

---

## Development Workflow

### Branch Strategy (Gitflow)

```
dev (default branch) → Development environment
  ↓ (merge when ready)
prod → Production environment
```

**Feature development:**
1. Create feature branch from `dev`
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```
2. Make changes, commit, push
3. Create PR to merge into `dev`
4. After testing in dev, merge `dev` → `prod` for production release

### Automated Deployments

- **Push to `dev`**: Deploys to development environment (dev.tfvars)
- **Push to `prod`**: Deploys to production environment (prod.tfvars)

GitHub Actions workflow (.github/workflows/deploy.yml):
1. Builds backend Lambda
2. Deploys infrastructure via Terraform
3. Builds frontend with env-specific config
4. Deploys to Netlify (dev or production context)

---

## Code Architecture & Patterns

### Frontend Architecture

**State Management:**
- **Server state**: React Query (caching, refetching, optimistic updates)
- **Auth state**: Custom `useAuth` hook with Cognito session
- **Form state**: React Hook Form
- **No global client state library** (Context used sparingly)

**Component Organization:**
- `auth/`: Login, ProtectedRoute
- `common/`: Reusable UI components (Button, Card, Modal, Layout)
- `gifter/`: Public-facing components (no auth)
- `lister/`: Authenticated components (Dashboard, GiftManager, forms)

**Routing:**
- `/login` - Login page
- `/` - Dashboard (protected)
- `/lists/:listId` - Gift manager (protected)
- `/gift-list/:shareCode` - Public list view (no auth)

**API Communication:**
- `services/api.ts`: Axios instance with interceptors for auth tokens
- `services/auth.ts`: Cognito integration (login, logout, session)
- `hooks/useQueries.ts`: React Query hooks for API calls

**Styling:**
- Tailwind utility classes
- Custom components use consistent spacing/color tokens
- Responsive design (mobile-first)

### Backend Architecture

**Handler Pattern:**
```typescript
// index.ts routes requests to specific handlers
export const handler = async (event: APIGatewayProxyEvent) => {
  // Route matching based on resource + httpMethod
  if (resource === '/lists' && httpMethod === 'GET') {
    return await getLists(event);
  }
  // ...
}
```

**File Organization:**
- `index.ts`: Main Lambda handler, route dispatcher
- `handlers/`: Business logic for each route group (lists, gifts, public)
- `services/`: Shared services (DynamoDB operations, validation)
- `middleware/`: Auth middleware (JWT verification)
- `utils/`: Helpers (response formatting, crypto)

**Authentication:**
- Cognito JWT tokens in `Authorization` header
- `middleware/auth.ts` extracts userId from token
- Public endpoints (`/public/*`) skip auth

**Validation:**
- Zod schemas in `services/validation.ts`
- Input validation on all endpoints
- Type-safe validation with TypeScript

**Error Handling:**
- Custom `ApiError` class with error codes
- Standardized error responses via `utils/response.ts`
- Errors logged to CloudWatch

### Database Design (DynamoDB Single-Table)

**Access Patterns:**
1. Get all lists for a user → GSI1 (OWNER#userId)
2. Get list by ID → PK (LIST#id)
3. Get list by share code → GSI2 (SHARE#code)
4. Get gifts for a list → PK (LIST#listId) + SK begins_with(GIFT#)
5. Get gift by ID → GSI1 (GIFT#id)

**Key Schema:**
```
List Item:
  PK: LIST#<id>
  SK: METADATA
  GSI1PK: OWNER#<userId>
  GSI1SK: CREATED#<timestamp>
  GSI2PK: SHARE#<code>
  GSI2SK: CREATED#<timestamp>

Gift Item:
  PK: LIST#<listId>
  SK: GIFT#<id>
  GSI1PK: GIFT#<id>
  GSI1SK: LIST#<listId>
```

**DynamoDB Operations:**
- All queries/scans in `services/dynamodb.ts`
- Conditional writes for race condition protection
- Batch operations for efficiency
- Consistent reads when required

---

## Key Conventions

### TypeScript

**Naming:**
- Interfaces: PascalCase (`List`, `Gift`, `CreateListRequest`)
- Enums: PascalCase with UPPER_CASE values (`ErrorCode.NOT_FOUND`)
- Functions: camelCase (`getList`, `createGiftHandler`)
- Files: camelCase or kebab-case (`dynamodb.ts`, `api-gateway.tf`)

**Types:**
- Shared types defined in `types/index.ts` (both frontend/backend)
- Keep frontend/backend types in sync manually
- Use `interface` for objects, `type` for unions/utilities

**Exports:**
- Named exports preferred over default exports (except React components)
- Export types alongside implementation

### Code Style

**Frontend:**
- Functional components with hooks (no class components)
- Props destructuring in function signature
- Early returns for cleaner code
- Custom hooks for reusable logic

**Backend:**
- Async/await (no callbacks)
- Explicit error handling (try/catch)
- Validate all inputs with Zod
- Return early for error cases

**Error Handling:**
- Frontend: Use React Query's error handling + toast notifications
- Backend: Throw `ApiError` with appropriate status codes

**Comments:**
- Write self-documenting code
- Add comments only for complex logic or business rules
- Use JSDoc for public API functions

### Git Commits

- Use descriptive commit messages
- Reference issue numbers when applicable
- Keep commits focused (single responsibility)
- CI runs linting and type checks on PRs

### File Naming

- React components: PascalCase (`.tsx`)
- Hooks: camelCase starting with `use` (`.ts`)
- Services/utilities: camelCase (`.ts`)
- Terraform: kebab-case (`.tf`)

---

## Environment Configuration

### Frontend Environment Variables

Required in `.env` (local) or Netlify dashboard (deployed):

```bash
VITE_API_URL=<api-gateway-url>
VITE_COGNITO_USER_POOL_ID=<cognito-pool-id>
VITE_COGNITO_CLIENT_ID=<cognito-client-id>
VITE_COGNITO_REGION=us-east-1
```

**Local Development:**
```bash
cd frontend
cp .env.example .env
# Edit .env with your values
npm run dev  # Runs on http://localhost:3000
```

### Backend Environment Variables

Set automatically by Terraform in Lambda configuration:

```bash
DYNAMODB_TABLE_NAME=gift-lists-<env>
COGNITO_USER_POOL_ID=<pool-id>
AWS_REGION=us-east-1
CORS_ORIGIN=<frontend-url>
```

### Terraform Variables

**Development (terraform/environments/dev.tfvars):**
```hcl
aws_region   = "us-east-1"
environment  = "dev"
project_name = "gift-list"
cors_origin  = "http://localhost:3000"
```

**Production (terraform/environments/prod.tfvars):**
```hcl
aws_region   = "us-east-1"
environment  = "prod"
project_name = "gift-list"
cors_origin  = "https://<prod-domain>.netlify.app"
```

---

## Common Development Tasks

### Local Development Setup

**Prerequisites:**
- Node.js 20+
- AWS CLI configured
- Terraform 1.6+

**Initial Setup:**
```bash
# Clone repository
git clone <repo-url>
cd gift-list

# Frontend
cd frontend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev

# Backend (in new terminal)
cd backend
npm install
npm run build
# Backend runs as Lambda; use AWS SAM/LocalStack for local testing
```

### Building

```bash
# Frontend
cd frontend
npm run build           # Output: dist/
npm run type-check      # TypeScript validation
npm run lint            # ESLint

# Backend
cd backend
npm run build           # Output: dist/
npm run type-check      # TypeScript validation
npm run lint            # ESLint
npm run package         # Creates function.zip for Lambda
```

### Infrastructure Deployment

```bash
cd terraform
terraform init

# Development
terraform plan -var-file="environments/dev.tfvars"
terraform apply -var-file="environments/dev.tfvars"

# Production
terraform plan -var-file="environments/prod.tfvars"
terraform apply -var-file="environments/prod.tfvars"

# Get outputs
terraform output
```

### Creating Cognito Users

Listers must be created manually:

```bash
aws cognito-idp admin-create-user \
  --user-pool-id <pool-id> \
  --username <email> \
  --user-attributes Name=email,Value=<email> Name=email_verified,Value=true \
  --temporary-password <temp-password>
```

### Updating Lambda Function Only

```bash
cd backend
npm run build

cd ../terraform
terraform apply -var-file="environments/dev.tfvars" \
  -target=aws_lambda_function.api_handler
```

---

## Testing Strategy

### Current State
- Testing infrastructure configured (Jest)
- No tests currently implemented
- **When adding tests, follow these patterns:**

**Frontend Tests:**
```bash
cd frontend
npm test
```

**Test Types to Add:**
- Component tests (React Testing Library)
- Hook tests
- Integration tests for user flows
- Mock API calls with MSW

**Backend Tests:**
```bash
cd backend
npm test
```

**Test Types to Add:**
- Unit tests for handlers
- DynamoDB service tests (mock AWS SDK)
- Validation tests
- Integration tests with LocalStack

---

## Deployment Process

### Automated Deployment (GitHub Actions)

**Workflow:** `.github/workflows/deploy.yml`

**Triggers:**
- Push to `dev` branch → dev environment
- Push to `prod` branch → prod environment

**Steps:**
1. Build backend (`npm run build`)
2. Deploy infrastructure (Terraform)
3. Get outputs (API URL, Cognito IDs)
4. Build frontend with environment variables
5. Deploy to Netlify (dev or production context)

**Required Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

### Manual Deployment

**Backend:**
```bash
cd backend
npm run build
cd ../terraform
terraform apply -var-file="environments/<env>.tfvars"
```

**Frontend:**
```bash
cd frontend
npm run build
npx netlify deploy --prod  # or omit --prod for preview
```

### Netlify Configuration

- Config: `netlify.toml` (gitflow contexts)
- Default branch: `dev`
- Production branch: `prod`
- Build command: `npm install && npm run build` (in `frontend/`)
- Publish dir: `frontend/dist`
- Environment variables set in Netlify dashboard

---

## Important Notes for AI Assistants

### When Making Code Changes

1. **Read Before Editing**: Always read files before making changes. Understand existing patterns and conventions.

2. **Type Safety**: Maintain TypeScript type safety. If you change a type in one place, check for impacts elsewhere.

3. **Shared Types**: Frontend and backend share type definitions. When modifying types:
   - Update `backend/src/types/index.ts`
   - Update `frontend/src/types/index.ts`
   - Keep them in sync manually

4. **DynamoDB Operations**: All DynamoDB queries/updates go through `backend/src/services/dynamodb.ts`. Don't scatter DynamoDB code.

5. **Validation**: Always validate user input with Zod schemas in `backend/src/services/validation.ts`.

6. **Error Handling**:
   - Backend: Throw `ApiError` with appropriate `ErrorCode`
   - Frontend: React Query handles errors, display with toast

7. **CORS**: When adding new API endpoints, ensure CORS headers are handled in `utils/response.ts`.

8. **Authentication**:
   - Protected endpoints: Extract userId from JWT via `middleware/auth.ts`
   - Public endpoints: No auth required (prefix with `/public`)

9. **Terraform Changes**: If you modify AWS resources, update:
   - Relevant `.tf` file
   - Environment-specific `.tfvars` files if needed
   - `outputs.tf` if new outputs needed

10. **Environment Variables**: When adding new env vars:
    - Update `.env.example` (frontend)
    - Document in this file
    - Update GitHub Actions workflow if needed
    - Update Netlify config if needed

### When Adding New Features

1. **Check PROMPT.md**: The full technical specification is in `PROMPT.md`. Reference it for detailed requirements.

2. **Follow Existing Patterns**:
   - Frontend: Study similar components in the same category (lister/gifter/common)
   - Backend: Study existing handlers for route structure

3. **API Endpoints**:
   - Add route in `backend/src/index.ts`
   - Create handler in appropriate file (`handlers/lists.ts`, etc.)
   - Add validation schema
   - Update API docs in README.md

4. **Database Changes**:
   - Consider access patterns first
   - Update DynamoDB schema in `terraform/dynamodb.tf` if needed
   - Add/update service methods in `services/dynamodb.ts`

5. **UI Components**:
   - Place in appropriate directory (auth/common/lister/gifter)
   - Use Tailwind utilities
   - Ensure responsive design
   - Follow accessibility best practices

### Testing Changes Locally

1. **Frontend Development**:
   ```bash
   cd frontend
   npm run dev  # Hot reload at http://localhost:3000
   ```

2. **Backend Testing**:
   - Deploy to dev environment to test
   - Or use AWS SAM/LocalStack for local Lambda testing

3. **Full Stack Testing**:
   - Deploy backend to dev environment
   - Point frontend `.env` to dev API URL
   - Test complete user flows

### Git Workflow

1. **Always work on feature branches** (never commit directly to `dev` or `prod`)
2. **Create PRs to `dev`** for review
3. **Test in dev environment** before merging to `prod`
4. **Use descriptive commit messages**

### Security Considerations

1. **Never commit secrets**: Check `.gitignore` covers all sensitive files
2. **Validate all inputs**: Use Zod schemas
3. **Use parameterized queries**: Always (DynamoDB SDK handles this)
4. **Sanitize user content**: Especially for URLs and messages
5. **CORS**: Only allow frontend domain
6. **Rate limiting**: Consider adding for public endpoints if needed

### Common Pitfalls to Avoid

1. **Don't modify generated files**: `dist/`, `.terraform/`, etc.
2. **Don't mix concerns**: Keep business logic in handlers, not middleware
3. **Don't skip validation**: Even for authenticated endpoints
4. **Don't hardcode values**: Use environment variables
5. **Don't ignore TypeScript errors**: Fix them properly
6. **Don't create new patterns**: Follow existing conventions unless there's a compelling reason

### When in Doubt

1. Check `PROMPT.md` for specification details
2. Look at similar existing code for patterns
3. Check README.md for user-facing documentation
4. Ask clarifying questions before making assumptions

---

## Quick Reference

### File Locations

| What | Where |
|------|-------|
| API routes | `backend/src/index.ts` |
| Route handlers | `backend/src/handlers/*.ts` |
| DynamoDB operations | `backend/src/services/dynamodb.ts` |
| Input validation | `backend/src/services/validation.ts` |
| Auth middleware | `backend/src/middleware/auth.ts` |
| Type definitions | `{backend,frontend}/src/types/index.ts` |
| React components | `frontend/src/components/` |
| API client | `frontend/src/services/api.ts` |
| Auth logic | `frontend/src/services/auth.ts` |
| React Query hooks | `frontend/src/hooks/useQueries.ts` |
| Infrastructure | `terraform/*.tf` |
| Environment config | `terraform/environments/*.tfvars` |
| CI/CD | `.github/workflows/*.yml` |

### Key Commands

```bash
# Frontend
npm run dev          # Dev server
npm run build        # Production build
npm run type-check   # TypeScript check
npm run lint         # ESLint

# Backend
npm run build        # Compile TypeScript
npm run type-check   # TypeScript check
npm run lint         # ESLint
npm run package      # Create Lambda zip

# Terraform
terraform init                                    # Initialize
terraform plan -var-file="environments/dev.tfvars"  # Plan
terraform apply -var-file="environments/dev.tfvars" # Apply
terraform output                                  # Show outputs

# Git
git checkout -b feature/name    # New feature branch
git push origin feature/name    # Push feature
# Create PR to dev via GitHub
```

### API Endpoint Structure

```
Authenticated (Listers):
  GET    /lists
  POST   /lists
  GET    /lists/:listId
  PUT    /lists/:listId
  DELETE /lists/:listId
  GET    /lists/:listId/gifts
  POST   /lists/:listId/gifts
  PUT    /gifts/:giftId
  DELETE /gifts/:giftId
  PUT    /gifts/:giftId/reorder
  POST   /gifts/:giftId/unclaim

Public (Gifters):
  GET    /public/lists/:shareCode
  GET    /public/lists/:shareCode/gifts
  POST   /public/gifts/:giftId/claim

Health:
  GET    /health
```

### DynamoDB Table

- **Table Name**: `gift-lists-{env}`
- **Primary Key**: PK (partition), SK (sort)
- **GSI1**: GSI1PK (partition), GSI1SK (sort)
- **GSI2**: GSI2PK (partition), GSI2SK (sort)
- **Billing**: On-demand
- **Backup**: Point-in-time recovery enabled

---

**Last Updated**: 2026-01-05

This document should be updated whenever significant architectural changes are made to the codebase.
