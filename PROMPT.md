# Gift List Coordination App - Technical Specification

## 1. Overview

A web application for coordinating gift-giving at Christmas. Authenticated listers create and manage gift lists, while anonymous gifters can claim gifts via shareable URLs.

## 2. User Types & Authentication

### Listers (Authenticated)
- Pre-configured users in AWS Cognito
- Email/password authentication
- Full CRUD access to their own lists and gifts
- Can view claim details (gifter name and message)

### Gifters (Anonymous)
- No authentication required
- Access lists via shareable URL
- Can claim/view gifts
- Provide name and optional message when claiming

## 3. Data Model

### List
```typescript
interface List {
  id: string;                    // UUID
  ownerId: string;               // Cognito user ID
  title: string;                 // e.g., "Emma's Christmas 2024"
  hideClaimedGifts: boolean;     // Display option for gifters
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  shareUrl: string;              // Generated shareable path (e.g., /gift-list/abc123xyz)
}
```

### Gift
```typescript
interface Gift {
  id: string;                    // UUID
  listId: string;                // Foreign key to List
  title: string;                 // Gift name
  description: string;           // Detailed description
  url?: string;                  // Optional product URL
  status: 'available' | 'claimed';
  claimedBy?: string;            // Gifter's name
  claimerMessage?: string;       // Optional message from gifter
  claimedAt?: string;            // ISO timestamp
  createdAt: string;
  updatedAt: string;
  sortOrder: number;             // For custom ordering
}
```

### DynamoDB Single Table Design
```
PK: LIST#<listId> | GIFT#<giftId>
SK: METADATA | LIST#<listId>
GSI1PK: OWNER#<ownerId>
GSI1SK: CREATED#<timestamp>
GSI2PK: SHARE#<shareCode>
```

## 4. Core Features

### 4.1 Lister Features

#### List Management
- Create new lists with title and display preferences
- Edit list title and hideClaimedGifts setting
- Delete lists (with confirmation)
- View all owned lists in dashboard
- Each list generates unique shareable URL

#### Gift Management
- Add gifts to list (title, description, optional URL)
- Edit gift details
- Delete gifts (with confirmation)
- Reorder gifts via drag-and-drop
- View claim status and details (name, message, timestamp)
- Unclaim gifts (reverses gifter's claim)

#### Dashboard View
- List of all lists owned by user
- Summary stats per list (total gifts, claimed count)
- Quick access to share URLs
- Last updated timestamps

### 4.2 Gifter Features

#### List Viewing
- Access list via shareable URL (no login)
- See available gifts with full details
- Claimed gifts either hidden or shown as "claimed" (based on list setting)

#### Gift Claiming
- Click to claim available gift
- Modal form requesting:
  - Name (required)
  - Message (optional, textarea)
- Immediate visual feedback on claim
- Confirmation message after successful claim

## 5. Technical Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query) v5
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI or shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Hosting**: Netlify

### Backend
- **API**: AWS API Gateway (REST)
- **Compute**: AWS Lambda (Node.js 20.x with TypeScript)
- **Database**: DynamoDB
- **Authentication**: AWS Cognito User Pool
- **CDN**: CloudFront (optional, for API caching)

### Infrastructure & DevOps
- **IaC**: Terraform
- **CI/CD**: GitHub Actions
- **Secrets**: AWS Secrets Manager / GitHub Secrets
- **Environments**: dev, prod

## 6. API Endpoints

### Lister Endpoints (Authenticated)

```
GET    /lists                          # Get all lists for authenticated user
POST   /lists                          # Create new list
GET    /lists/:listId                  # Get list details
PUT    /lists/:listId                  # Update list
DELETE /lists/:listId                  # Delete list

GET    /lists/:listId/gifts            # Get all gifts for list
POST   /lists/:listId/gifts            # Create gift
PUT    /gifts/:giftId                  # Update gift
DELETE /gifts/:giftId                  # Delete gift
PUT    /gifts/:giftId/reorder          # Update sort order
POST   /gifts/:giftId/unclaim          # Remove claim
```

### Gifter Endpoints (Public)

```
GET    /public/lists/:shareCode        # Get list by share code
GET    /public/lists/:shareCode/gifts  # Get gifts (respects hideClaimedGifts)
POST   /public/gifts/:giftId/claim     # Claim a gift
```

## 7. User Flows

### 7.1 Lister: Create List and Add Gifts

1. Login to dashboard
2. Click "Create New List"
3. Enter list title (e.g., "Oliver's Christmas 2024")
4. Set hideClaimedGifts preference
5. Submit → List created, redirected to list detail page
6. Click "Add Gift"
7. Fill form: title, description, optional URL
8. Submit → Gift appears in list
9. Repeat for all gifts
10. Copy shareable URL to send to family/friends

### 7.2 Gifter: Claim Gift

1. Receive shareable URL from lister
2. Open URL in browser (no login required)
3. Browse available gifts
4. Click "Claim" on desired gift
5. Modal opens: enter name and optional message
6. Submit → Gift marked as claimed
7. Confirmation shown, gift hidden/marked (based on list settings)

### 7.3 Lister: View Claims

1. Login to dashboard
2. Select list
3. View all gifts with claim status
4. Claimed gifts show: gifter name, message, timestamp
5. Option to unclaim if needed

## 8. Security Considerations

### Authentication
- Cognito JWT tokens for lister endpoints
- API Gateway authorizer validates tokens
- Listers can only access their own lists/gifts

### Authorization Rules
- Listers: Can only CRUD their own resources
- Gifters: Read-only on public endpoints, write-only to claim
- Share codes: Unguessable (crypto.randomBytes), but not time-limited

### Data Validation
- Server-side validation on all inputs
- URL validation for gift URLs
- XSS protection via React's built-in escaping
- Rate limiting on claim endpoint to prevent abuse

## 9. Infrastructure Architecture

### AWS Resources (Terraform)

```hcl
# Cognito User Pool
resource "aws_cognito_user_pool" "listers"
resource "aws_cognito_user_pool_client" "web"

# DynamoDB Table
resource "aws_dynamodb_table" "gift_lists"
# - On-demand billing
# - GSI for owner queries
# - GSI for share code lookups

# Lambda Functions
resource "aws_lambda_function" "api_handler"
# - Node.js 20.x runtime
# - Environment variables (table names, etc.)

# API Gateway
resource "aws_apigatewayv2_api" "gift_api"
# - CORS configuration
# - Cognito authorizer for /lists/* routes
# - Lambda integration

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "lambda_logs"
```

### GitHub Actions Workflows

**CI Workflow (.github/workflows/ci.yml)**
```yaml
name: CI
on: [pull_request]
jobs:
  test-frontend:
    # npm install, lint, type-check, test
  test-backend:
    # npm install, lint, type-check, test
  terraform-plan:
    # terraform fmt, validate, plan
```

**CD Workflow (.github/workflows/deploy.yml)**
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy-infrastructure:
    # terraform apply
  deploy-backend:
    # build lambda, upload to S3, update function
  deploy-frontend:
    # build React app, deploy to Netlify
```

## 10. Configuration

### Lister User Management
```typescript
// terraform/cognito-users.tf
# Pre-configured users defined in Terraform
# Or manually created in Cognito console
# Each user gets email/password credentials
```

### Environment Variables

**Frontend (.env)**
```
VITE_API_URL=https://api.example.com
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
VITE_COGNITO_REGION=
```

**Backend (Lambda environment)**
```
DYNAMODB_TABLE_NAME=gift-lists
COGNITO_USER_POOL_ID=
AWS_REGION=
CORS_ORIGIN=https://app.example.com
```

## 11. Project Structure

```
gift-list-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── lister/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── ListForm.tsx
│   │   │   │   ├── GiftForm.tsx
│   │   │   │   └── GiftManager.tsx
│   │   │   ├── gifter/
│   │   │   │   ├── PublicListView.tsx
│   │   │   │   ├── GiftCard.tsx
│   │   │   │   └── ClaimModal.tsx
│   │   │   ├── auth/
│   │   │   │   ├── Login.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   └── common/
│   │   │       ├── Layout.tsx
│   │   │       └── Button.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   └── queries.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/
│   ├── src/
│   │   ├── handlers/
│   │   │   ├── lists.ts
│   │   │   ├── gifts.ts
│   │   │   └── public.ts
│   │   ├── services/
│   │   │   ├── dynamodb.ts
│   │   │   └── validation.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── errorHandler.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
│
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── cognito.tf
│   ├── dynamodb.tf
│   ├── lambda.tf
│   ├── api-gateway.tf
│   └── environments/
│       ├── dev.tfvars
│       └── prod.tfvars
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
└── README.md
```

## 12. Development Workflow

### Initial Setup
1. Clone repository
2. Configure AWS credentials
3. Run `terraform init && terraform apply` (creates infrastructure)
4. Create Cognito users via console
5. Install frontend dependencies: `cd frontend && npm install`
6. Install backend dependencies: `cd backend && npm install`
7. Set environment variables
8. Run local dev: `npm run dev` (frontend) and SAM local for backend testing

### Feature Development
1. Create feature branch
2. Develop locally
3. Write tests
4. Push → triggers CI (tests + terraform plan)
5. Create PR → review
6. Merge to main → triggers CD (deploys to prod)

## 13. Testing Strategy

### Frontend
- Unit tests: React Testing Library + Vitest
- Component tests for forms, modals
- Integration tests for key flows (create list, claim gift)

### Backend
- Unit tests: Jest
- Handler tests with mocked DynamoDB
- Validation tests
- Authorization tests

### E2E (Optional)
- Playwright for critical user journeys
- Run against staging environment

## 14. Future Enhancements (Out of Scope)

- Email notifications on claims
- Multi-language support
- Gift images/photos
- Price tracking
- Mobile app (React Native)
- List templates
- Collaborative lists (multiple listers)
- Gift suggestions based on age/interests
- Export list to PDF/email

## 15. Success Criteria

- Listers can create and manage lists in <2 minutes
- Gifters can claim gifts without any authentication friction
- Shareable URLs work on all devices/browsers
- No claim conflicts (race conditions handled)
- Zero downtime deployments
- All data stored securely
- GDPR-compliant (no PII stored for gifters beyond what they provide)

## 16. Deployment Checklist

### Pre-Launch
- [ ] Terraform infrastructure deployed
- [ ] Cognito users created for all listers
- [ ] Frontend deployed to Netlify
- [ ] Backend Lambda functions deployed
- [ ] Environment variables configured
- [ ] API Gateway CORS configured
- [ ] DynamoDB table created with GSIs
- [ ] CloudWatch monitoring enabled

### Post-Launch
- [ ] Share URLs tested from multiple devices
- [ ] Claim functionality verified
- [ ] Authentication flow tested
- [ ] Error handling verified
- [ ] Monitor CloudWatch logs for errors
- [ ] Set up billing alerts

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-04  
**Author**: Tom (HMCTS)
