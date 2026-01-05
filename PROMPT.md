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

**Table Structure**
```
Table Name: gift-lists
PK (Partition Key): String
SK (Sort Key): String
GSI1PK: String (Global Secondary Index 1)
GSI1SK: String
GSI2PK: String (Global Secondary Index 2)
GSI2SK: String
```

**Item Patterns**

List Item:
```
PK: LIST#<listId>
SK: METADATA
GSI1PK: OWNER#<ownerId>
GSI1SK: CREATED#<timestamp>
GSI2PK: SHARE#<shareCode>
GSI2SK: CREATED#<timestamp>
Attributes: title, hideClaimedGifts, createdAt, updatedAt, shareUrl, ownerId
```

Gift Item:
```
PK: LIST#<listId>
SK: GIFT#<giftId>
GSI1PK: GIFT#<giftId>
GSI1SK: LIST#<listId>
Attributes: title, description, url, status, claimedBy, claimerMessage,
            claimedAt, createdAt, updatedAt, sortOrder
```

**Access Patterns**

| Pattern | Operation | Keys |
|---------|-----------|------|
| Get list by ID | Query | PK=LIST#<listId>, SK=METADATA |
| Get all gifts for list | Query | PK=LIST#<listId>, SK begins_with GIFT# |
| Get all lists for owner | Query GSI1 | GSI1PK=OWNER#<ownerId> |
| Get list by share code | Query GSI2 | GSI2PK=SHARE#<shareCode> |
| Get single gift | Query GSI1 | GSI1PK=GIFT#<giftId> |
| Update gift sort order | UpdateItem | PK=LIST#<listId>, SK=GIFT#<giftId> |
| Delete list with gifts | BatchWriteItem | Delete all items with PK=LIST#<listId> |

**Capacity Planning**
- Billing Mode: On-Demand (PAY_PER_REQUEST)
- Expected read/write patterns:
  - Reads: Mostly sporadic during holiday season
  - Writes: Low volume (list/gift CRUD)
  - Public endpoint reads: Potentially higher during gifter activity
- Projected monthly cost: $1-5 for small family usage

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
- **Deployment Strategy**: Gitflow with `dev` (default branch) and `prod` branches
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

## 8. Error Handling & Validation

### 8.1 API Error Responses

All API endpoints return consistent error format:
```typescript
interface ErrorResponse {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable message
    details?: any;          // Optional additional context
    requestId: string;      // For debugging/support
  }
}
```

**HTTP Status Codes**
- `200`: Success
- `201`: Created
- `204`: No Content (successful deletion)
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (e.g., race condition on claim)
- `429`: Too Many Requests (rate limit)
- `500`: Internal Server Error

**Common Error Codes**
```typescript
enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_CLAIMED = 'ALREADY_CLAIMED',
  GIFT_NOT_AVAILABLE = 'GIFT_NOT_AVAILABLE',
  LIST_NOT_FOUND = 'LIST_NOT_FOUND',
  INVALID_SHARE_CODE = 'INVALID_SHARE_CODE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

### 8.2 Input Validation Rules

**List Validation**
- `title`: 1-100 characters, required
- `hideClaimedGifts`: boolean, required

**Gift Validation**
- `title`: 1-200 characters, required
- `description`: 0-2000 characters, optional
- `url`: Valid HTTP(S) URL, max 2000 characters, optional
- `sortOrder`: Positive integer

**Claim Validation**
- `claimedBy`: 1-100 characters, required, no special characters
- `claimerMessage`: 0-500 characters, optional

### 8.3 Race Condition Handling

**Gift Claiming**
Uses DynamoDB conditional writes to prevent double-claims:
```typescript
// UpdateItem with condition expression
ConditionExpression: "attribute_not_exists(claimedBy) AND #status = :available"
// If condition fails, return 409 Conflict
```

**Optimistic Locking for Updates**
Use `updatedAt` timestamp for version checking:
```typescript
ConditionExpression: "updatedAt = :expectedVersion"
```

### 8.4 Frontend Error Handling

**Error Boundaries**
- Top-level error boundary catches React crashes
- Graceful fallback UI with retry option
- Automatic error logging to CloudWatch (via API)

**Toast Notifications**
- Success: Green toast with confirmation
- Error: Red toast with user-friendly message
- Warning: Yellow toast for conflicts/validation

**Form Validation**
- Client-side validation with React Hook Form + Zod
- Real-time field validation on blur
- Server errors mapped to form fields

## 9. UI/UX Design Patterns

### 9.1 Design System

**Color Palette**
```css
/* Primary - Christmas theme */
--color-primary: #165B33;      /* Forest green */
--color-secondary: #BB2528;    /* Christmas red */
--color-accent: #F8B229;       /* Gold */

/* Neutrals */
--color-background: #FAFAFA;
--color-surface: #FFFFFF;
--color-text-primary: #212121;
--color-text-secondary: #757575;
--color-border: #E0E0E0;

/* Status */
--color-success: #4CAF50;
--color-error: #F44336;
--color-warning: #FF9800;
--color-info: #2196F3;
```

**Typography**
- Font family: Inter or system fonts
- Headings: 24px/32px/40px (bold)
- Body: 16px (regular/medium)
- Small: 14px
- Line height: 1.5

**Spacing Scale**
- 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

### 9.2 Component Patterns

**Button Variants**
- Primary: Solid background, white text (main actions)
- Secondary: Outline, transparent background (cancel)
- Ghost: No border, text only (tertiary actions)
- Danger: Red background (delete/unclaim)

**Card Component**
- Border radius: 8px
- Shadow: subtle elevation
- Padding: 16px/24px
- Hover state: slight elevation increase

**Modal/Dialog**
- Center screen overlay
- Max width: 600px
- Backdrop: semi-transparent black
- Close on ESC key or backdrop click
- Focus trap inside modal

### 9.3 Responsive Design

**Breakpoints**
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

**Mobile-First Approach**
- Stack elements vertically on mobile
- Horizontal layouts on tablet+
- Touch-friendly targets (min 44px)
- Simplified navigation on mobile

### 9.4 Accessibility (WCAG 2.1 AA)

**Keyboard Navigation**
- All interactive elements focusable
- Visible focus indicators
- Logical tab order
- Keyboard shortcuts for common actions

**Screen Reader Support**
- Semantic HTML elements
- ARIA labels for icons/buttons
- Live regions for dynamic updates (claims)
- Descriptive alt text for images

**Color Contrast**
- Text: minimum 4.5:1 contrast ratio
- Large text: 3:1
- Interactive elements: 3:1

**Form Accessibility**
- Labels associated with inputs
- Error messages announced
- Required fields indicated
- Help text for complex fields

### 9.5 Loading States

**Skeleton Screens**
- Show content structure while loading
- Animated pulse effect
- Match final content layout

**Spinners**
- Button loading: inline spinner + disabled state
- Page loading: centered spinner
- Minimum display time: 300ms (avoid flashing)

**Optimistic Updates**
- Gift claim: immediate UI update
- Rollback on error with toast notification
- List/gift edits: instant feedback

## 10. Security Considerations

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
- SQL injection: N/A (NoSQL database)
- Path traversal: Input sanitization on all IDs

### Rate Limiting

**API Gateway Throttling**
- Authenticated endpoints: 100 requests/second per user
- Public endpoints: 50 requests/second per IP
- Burst: 200 requests

**Application-Level Rate Limiting**
- Gift claim endpoint: 5 claims per minute per IP
- Implementation: DynamoDB with TTL for rate limit tracking
- Response: 429 status with Retry-After header

**DDoS Protection**
- AWS Shield Standard (included)
- CloudFront for caching and protection
- WAF rules for common attack patterns (optional)

### Security Headers

```typescript
// Lambda response headers
{
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}
```

### Secrets Management
- Cognito secrets: AWS Secrets Manager
- Environment variables: Lambda environment (encrypted at rest)
- API keys: Never in client code
- Rotation policy: Annual or on suspicion of compromise

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
    branches:
      - dev      # Development environment
      - prod     # Production environment
jobs:
  deploy-infrastructure:
    # terraform apply with environment-specific tfvars (dev.tfvars or prod.tfvars)
  deploy-backend:
    # build lambda, upload to S3, update function
  deploy-frontend:
    # build React app, deploy to Netlify (development or production context)
```

## 10. Performance Considerations

### 10.1 Frontend Optimization

**Code Splitting**
```typescript
// Route-based code splitting
const Dashboard = lazy(() => import('./components/lister/Dashboard'));
const PublicListView = lazy(() => import('./components/gifter/PublicListView'));
```

**Bundle Size**
- Target: < 200KB initial bundle (gzipped)
- Tree shaking: Remove unused code
- Dynamic imports for heavy libraries
- Analyze with `vite-bundle-visualizer`

**Caching Strategy**
```typescript
// Service Worker (optional)
- Cache static assets (JS, CSS, images)
- Network-first for API calls
- Offline fallback page

// Browser caching headers
- Immutable assets: cache-control: public, max-age=31536000, immutable
- HTML: cache-control: no-cache
```

**React Query Configuration**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,        // 30 seconds
      cacheTime: 300000,       // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});
```

**Image Optimization**
- Lazy load images below fold
- Responsive images with srcset
- WebP format with fallbacks
- Compress images (TinyPNG)

### 10.2 Backend Optimization

**Lambda Performance**
```typescript
// Cold start optimization
- Provisioned concurrency: Optional for critical endpoints
- Memory: 512MB-1024MB (balance cost vs performance)
- Handler optimization: Reuse connections, minimize imports

// Connection pooling
const dynamoDb = new DynamoDB.DocumentClient({
  maxRetries: 2,
  httpOptions: { timeout: 5000 }
});
```

**DynamoDB Optimization**
- Single-table design reduces round trips
- Batch operations for bulk reads/writes
- Use query over scan (always)
- Project only needed attributes
- Consider DAX for high-read scenarios (likely overkill for this app)

**API Gateway Caching**
```hcl
# Optional: Cache public list/gift GET requests
cache_cluster_enabled = true
cache_cluster_size = "0.5"  # Smallest size
cache_ttl_seconds = 300     # 5 minutes
cache_key_parameters = ["path", "querystring"]
```

### 10.3 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to Interactive (TTI) | < 3s | Lighthouse |
| First Contentful Paint (FCP) | < 1.5s | Lighthouse |
| API Response Time (p95) | < 500ms | CloudWatch |
| Lambda Cold Start | < 2s | CloudWatch |
| DynamoDB Latency | < 50ms | X-Ray |
| Lighthouse Score | > 90 | CI/CD check |

## 11. Monitoring & Observability

### 11.1 CloudWatch Metrics

**Lambda Metrics**
- Invocations, Errors, Throttles
- Duration (avg, p50, p95, p99, max)
- Concurrent executions
- Cold start count (custom metric)

**API Gateway Metrics**
- Request count by endpoint
- 4xx/5xx error rates
- Integration latency
- Cache hit/miss ratio

**DynamoDB Metrics**
- Read/write capacity consumed
- Throttled requests
- System errors
- Conditional check failures (claim conflicts)

**Custom Application Metrics**
```typescript
// CloudWatch Embedded Metrics Format
const metrics = {
  _aws: {
    Timestamp: Date.now(),
    CloudWatchMetrics: [{
      Namespace: 'GiftList',
      Dimensions: [['Environment', 'Operation']],
      Metrics: [{ Name: 'ClaimSuccess', Unit: 'Count' }]
    }]
  },
  Environment: 'prod',
  Operation: 'claim-gift',
  ClaimSuccess: 1
};
console.log(JSON.stringify(metrics));
```

### 11.2 Logging Strategy

**Log Levels**
- ERROR: Failures, exceptions (alert)
- WARN: Recoverable issues, validation failures
- INFO: Key operations (claim, create, delete)
- DEBUG: Detailed flow (dev only)

**Structured Logging**
```typescript
logger.info('Gift claimed', {
  giftId: gift.id,
  listId: gift.listId,
  claimedBy: gift.claimedBy,
  timestamp: new Date().toISOString(),
  requestId: context.requestId
});
```

**Log Retention**
- Production: 90 days
- Development: 7 days
- Cost optimization: Archive to S3 after 30 days

### 11.3 Distributed Tracing

**AWS X-Ray**
```typescript
// Enable X-Ray for Lambda and API Gateway
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

// Trace segments
const segment = AWSXRay.getSegment();
const subsegment = segment.addNewSubsegment('DynamoDB-Query');
// ... perform query ...
subsegment.close();
```

**Trace key operations:**
- Full claim flow (public API → Lambda → DynamoDB)
- List creation with gifts
- Dashboard load (multiple DynamoDB queries)

### 11.4 Alerting & Monitoring

**CloudWatch Alarms**

Critical (PagerDuty/Email):
- Lambda error rate > 5% (5 min window)
- API Gateway 5xx rate > 1% (5 min window)
- DynamoDB throttling events
- Lambda concurrent execution > 80% limit

Warning (Slack/Email):
- API Gateway 4xx rate > 10%
- Lambda duration p95 > 1s
- Claim conflicts > 10/hour

**Health Check**
```
GET /health
Response: { status: 'ok', timestamp: '...', version: '1.0.0' }
```

**Monitoring Dashboard**
- CloudWatch Dashboard with key metrics
- Real-time updates during peak usage (Dec)
- Historical trends (week/month views)

## 12. Cost Estimation

### 12.1 AWS Cost Breakdown (Monthly)

**Assumptions**
- 5 active listers
- 10 lists total
- 100 gifts across all lists
- 50 gifters accessing lists
- 200 gift claims in December
- 1000 API requests/day (peak: 5000/day in Dec)

**Service Costs**

| Service | Usage | Cost/Month |
|---------|-------|------------|
| **DynamoDB** | | |
| - On-demand reads | ~30K reads/month | $0.04 |
| - On-demand writes | ~6K writes/month | $0.08 |
| - Storage (< 1GB) | 0.1 GB | $0.03 |
| **Lambda** | | |
| - Invocations | 30K/month (150K in Dec) | $0.01-$0.03 |
| - Duration (512MB, 200ms avg) | 1.67 GB-hrs | $0.03 |
| **API Gateway** | | |
| - REST API requests | 30K/month | $0.10 |
| **Cognito** | | |
| - MAU (< 50,000) | 5 users | Free |
| **CloudWatch** | | |
| - Logs (1GB/month) | 1GB | $0.50 |
| - Metrics (10 custom) | 10 metrics | $3.00 |
| - Alarms (5) | 5 alarms | $0.50 |
| **Secrets Manager** (optional) | 1 secret | $0.40 |
| **Total (Normal)** | | **~$4.69** |
| **Total (Dec Peak)** | | **~$8-12** |

**Netlify (Frontend Hosting)**
- Free tier: 100GB bandwidth, 300 build minutes
- Expected: Well within limits
- Cost: **$0**

**GitHub Actions (CI/CD)**
- Free tier: 2000 minutes/month for private repos
- Expected: ~200 minutes/month
- Cost: **$0**

**Total Monthly Cost: $5-12**
**Annual Cost: ~$60-100**

### 12.2 Cost Optimization Strategies

1. **DynamoDB**: On-demand is cost-effective for this usage pattern
2. **Lambda**: Right-size memory (test 256MB vs 512MB vs 1024MB)
3. **CloudWatch Logs**: Reduce retention in dev, filter noisy logs
4. **API Gateway Caching**: Only if high read volume justifies it
5. **Reserved Capacity**: Not needed at this scale

### 12.3 Scaling Projections

**10x Growth (50 listers, 1000 gifts, 500 gifters)**
- DynamoDB: ~$2-3/month
- Lambda: ~$1-2/month
- API Gateway: ~$1/month
- CloudWatch: ~$5-8/month
- **Total: $25-35/month**

Still well within serverless cost efficiency.

## 13. Backup & Disaster Recovery

### 13.1 Backup Strategy

**DynamoDB Backups**
```hcl
# Point-in-time recovery (PITR)
resource "aws_dynamodb_table" "gift_lists" {
  point_in_time_recovery {
    enabled = true
  }
}
```

- PITR: Continuous backups, restore to any point in last 35 days
- On-demand backups: Before major changes/deployments
- Cross-region backup: Optional (overkill for this app)
- Cost: $0.20/GB/month for PITR

**Backup Schedule**
- Automated daily backups via AWS Backup (optional)
- Retention: 30 days
- Trigger: Lambda post-deployment (create snapshot)

### 13.2 Disaster Recovery Plan

**RTO (Recovery Time Objective): 4 hours**
**RPO (Recovery Point Objective): 1 minute** (via PITR)

**Failure Scenarios**

1. **DynamoDB Table Corruption**
   - Restore from PITR to new table
   - Update Lambda environment variables
   - Redeploy API Gateway
   - Estimated time: 30 minutes

2. **Lambda Code Bug (Production)**
   - Rollback to previous version (Lambda versioning)
   - Revert Git commit
   - Redeploy via CI/CD
   - Estimated time: 10 minutes

3. **Region Outage (us-east-1)**
   - Manual failover to standby region (if implemented)
   - Update DNS/Netlify config
   - Restore DynamoDB from backup to new region
   - Estimated time: 2-4 hours
   - **Recommendation**: Not needed for this use case

4. **Complete Data Loss**
   - Restore from last PITR backup
   - Data loss: Maximum 1 minute of transactions
   - Notify users of potential claim conflicts
   - Estimated time: 1 hour

### 13.3 Testing DR Procedures

**Quarterly DR Drill**
1. Create test DynamoDB table
2. Restore from production backup
3. Verify data integrity
4. Test Lambda connection to restored table
5. Document any issues
6. Time the recovery process

## 14. Configuration

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

## 15. API Request/Response Examples

### 15.1 Lister Endpoints

**Create List**
```http
POST /lists
Authorization: Bearer <cognito-jwt-token>
Content-Type: application/json

{
  "title": "Emma's Christmas 2024",
  "hideClaimedGifts": true
}

Response: 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "ownerId": "cognito-user-id-123",
  "title": "Emma's Christmas 2024",
  "hideClaimedGifts": true,
  "shareUrl": "/gift-list/abc123xyz789",
  "createdAt": "2024-11-01T10:00:00.000Z",
  "updatedAt": "2024-11-01T10:00:00.000Z"
}
```

**Get All Lists for User**
```http
GET /lists
Authorization: Bearer <cognito-jwt-token>

Response: 200 OK
{
  "lists": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Emma's Christmas 2024",
      "hideClaimedGifts": true,
      "shareUrl": "/gift-list/abc123xyz789",
      "giftCount": 15,
      "claimedCount": 7,
      "createdAt": "2024-11-01T10:00:00.000Z",
      "updatedAt": "2024-12-15T14:30:00.000Z"
    }
  ]
}
```

**Create Gift**
```http
POST /lists/550e8400-e29b-41d4-a716-446655440000/gifts
Authorization: Bearer <cognito-jwt-token>
Content-Type: application/json

{
  "title": "LEGO Star Wars Millennium Falcon",
  "description": "The ultimate LEGO set for Star Wars fans. 7541 pieces!",
  "url": "https://www.lego.com/en-us/product/millennium-falcon-75192",
  "sortOrder": 1
}

Response: 201 Created
{
  "id": "660f9511-f39c-52e5-b827-557766551111",
  "listId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "LEGO Star Wars Millennium Falcon",
  "description": "The ultimate LEGO set for Star Wars fans. 7541 pieces!",
  "url": "https://www.lego.com/en-us/product/millennium-falcon-75192",
  "status": "available",
  "sortOrder": 1,
  "createdAt": "2024-11-01T10:05:00.000Z",
  "updatedAt": "2024-11-01T10:05:00.000Z"
}
```

**Get Gifts for List (Lister View)**
```http
GET /lists/550e8400-e29b-41d4-a716-446655440000/gifts
Authorization: Bearer <cognito-jwt-token>

Response: 200 OK
{
  "gifts": [
    {
      "id": "660f9511-f39c-52e5-b827-557766551111",
      "listId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "LEGO Star Wars Millennium Falcon",
      "description": "The ultimate LEGO set...",
      "url": "https://www.lego.com/...",
      "status": "claimed",
      "claimedBy": "Uncle Dave",
      "claimerMessage": "Can't wait to build this together!",
      "claimedAt": "2024-12-10T08:30:00.000Z",
      "sortOrder": 1,
      "createdAt": "2024-11-01T10:05:00.000Z",
      "updatedAt": "2024-12-10T08:30:00.000Z"
    },
    {
      "id": "770f9522-f49d-63f6-c938-668877662222",
      "listId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Wireless Headphones",
      "description": "Noise cancelling, Bluetooth 5.0",
      "status": "available",
      "sortOrder": 2,
      "createdAt": "2024-11-01T10:10:00.000Z",
      "updatedAt": "2024-11-01T10:10:00.000Z"
    }
  ]
}
```

**Unclaim Gift**
```http
POST /gifts/660f9511-f39c-52e5-b827-557766551111/unclaim
Authorization: Bearer <cognito-jwt-token>

Response: 200 OK
{
  "id": "660f9511-f39c-52e5-b827-557766551111",
  "status": "available",
  "claimedBy": null,
  "claimerMessage": null,
  "claimedAt": null,
  "updatedAt": "2024-12-16T11:00:00.000Z"
}
```

### 15.2 Gifter (Public) Endpoints

**Get List by Share Code**
```http
GET /public/lists/abc123xyz789

Response: 200 OK
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Emma's Christmas 2024",
  "hideClaimedGifts": true
}
```

**Get Gifts (Gifter View)**
```http
GET /public/lists/abc123xyz789/gifts

Response: 200 OK
{
  "gifts": [
    {
      "id": "770f9522-f49d-63f6-c938-668877662222",
      "title": "Wireless Headphones",
      "description": "Noise cancelling, Bluetooth 5.0",
      "url": "https://example.com/headphones",
      "status": "available"
      // Note: No sortOrder, claimedBy, or claimerMessage exposed
    }
    // Claimed gifts hidden if hideClaimedGifts=true
    // Or shown with status="claimed" if hideClaimedGifts=false
  ]
}
```

**Claim Gift**
```http
POST /public/gifts/770f9522-f49d-63f6-c938-668877662222/claim
Content-Type: application/json

{
  "claimedBy": "Aunt Sarah",
  "claimerMessage": "Perfect! She'll love these."
}

Response: 200 OK
{
  "id": "770f9522-f49d-63f6-c938-668877662222",
  "status": "claimed",
  "claimedAt": "2024-12-16T12:00:00.000Z"
}

// Error Response (already claimed)
Response: 409 Conflict
{
  "error": {
    "code": "ALREADY_CLAIMED",
    "message": "This gift has already been claimed",
    "requestId": "req-123-456"
  }
}
```

### 15.3 Error Response Examples

**Validation Error**
```http
POST /lists
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "",  // Invalid: empty title
  "hideClaimedGifts": "yes"  // Invalid: not boolean
}

Response: 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "title": "Title must be between 1 and 100 characters",
      "hideClaimedGifts": "Must be a boolean value"
    },
    "requestId": "req-789-012"
  }
}
```

**Authorization Error**
```http
GET /lists/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token-for-different-user>

Response: 403 Forbidden
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource",
    "requestId": "req-345-678"
  }
}
```

**Rate Limit Error**
```http
POST /public/gifts/770f9522-f49d-63f6-c938-668877662222/claim

Response: 429 Too Many Requests
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many claim attempts. Please try again later.",
    "requestId": "req-901-234"
  },
  "headers": {
    "Retry-After": "60"  // Seconds
  }
}
```

## 16. Project Structure

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

## 17. Development Workflow

### Initial Setup
1. Clone repository
2. Configure AWS credentials
3. Run `terraform init && terraform apply` (creates infrastructure)
4. Create Cognito users via console
5. Install frontend dependencies: `cd frontend && npm install`
6. Install backend dependencies: `cd backend && npm install`
7. Set environment variables
8. Run local dev: `npm run dev` (frontend) and SAM local for backend testing

### Feature Development (Gitflow)
1. Create feature branch from `dev`
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/new-feature
   ```
2. Develop locally
3. Write tests
4. Push → triggers CI (tests + terraform plan)
5. Create PR to merge into `dev` → review
6. Merge to `dev` → triggers CD (deploys to development environment)
7. Test in development environment
8. When ready for production, create PR from `dev` to `prod`
9. Merge to `prod` → triggers CD (deploys to production environment)

## 18. Testing Strategy

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

## 19. Future Enhancements (Out of Scope)

- Email notifications on claims
- Multi-language support
- Gift images/photos
- Price tracking
- Mobile app (React Native)
- List templates
- Collaborative lists (multiple listers)
- Gift suggestions based on age/interests
- Export list to PDF/email

## 20. Success Criteria

- Listers can create and manage lists in <2 minutes
- Gifters can claim gifts without any authentication friction
- Shareable URLs work on all devices/browsers
- No claim conflicts (race conditions handled)
- Zero downtime deployments
- All data stored securely
- GDPR-compliant (no PII stored for gifters beyond what they provide)

## 21. Deployment Checklist

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
