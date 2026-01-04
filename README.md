# Gift List - Christmas Gift Coordination App

A full-stack web application for coordinating Christmas gift-giving. Authenticated users (listers) create and manage gift lists, while anonymous users (gifters) can claim gifts via shareable URLs.

## Architecture Overview

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: AWS Lambda (Node.js 20) + API Gateway
- **Database**: DynamoDB (single-table design)
- **Authentication**: AWS Cognito
- **Infrastructure**: Terraform
- **Hosting**: Netlify (frontend), AWS (backend)
- **Deployment**: Gitflow with `dev` (default) and `prod` branches

## Features

### For Listers (Authenticated Users)
- Create and manage multiple gift lists
- Add, edit, delete, and reorder gifts
- View who claimed each gift with optional messages
- Generate shareable URLs for each list
- Unclaim gifts if needed

### For Gifters (Anonymous Users)
- Access lists via shareable URLs (no login required)
- Browse available gifts with descriptions and product links
- Claim gifts with name and optional message
- View claimed status (based on list settings)

## Project Structure

```
gift-list/
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API and auth services
│   │   ├── hooks/         # Custom React hooks
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── package.json
├── backend/               # Lambda backend
│   ├── src/
│   │   ├── handlers/      # API route handlers
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Auth middleware
│   │   └── types/         # TypeScript types
│   └── package.json
├── terraform/             # Infrastructure as Code
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── dynamodb.tf
│   ├── cognito.tf
│   ├── lambda.tf
│   ├── api-gateway.tf
│   └── environments/
└── PROMPT.md             # Full technical specification
```

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm or yarn
- AWS CLI configured with credentials
- Terraform 1.0 or later (for infrastructure deployment)

### Local Development Setup

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd gift-list
```

#### 2. Frontend Setup

```bash
cd frontend
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your values:
# VITE_API_URL=http://localhost:3001
# VITE_COGNITO_USER_POOL_ID=<your-pool-id>
# VITE_COGNITO_CLIENT_ID=<your-client-id>
# VITE_COGNITO_REGION=us-east-1

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

#### 3. Backend Setup

```bash
cd backend
npm install

# Build TypeScript
npm run build

# The backend is deployed as Lambda functions
# For local testing, you can use AWS SAM or LocalStack
```

### Infrastructure Deployment

This project supports two environments: **development** and **production**, each with separate AWS resources.

#### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

#### 2. Deploy to Development Environment

The development environment is deployed from the `dev` branch:

```bash
# Review the plan
terraform plan -var-file="environments/dev.tfvars"

# Apply the changes
terraform apply -var-file="environments/dev.tfvars"
```

#### 3. Deploy to Production Environment

The production environment is deployed from the `prod` branch:

```bash
# Review the plan
terraform plan -var-file="environments/prod.tfvars"

# Apply the changes
terraform apply -var-file="environments/prod.tfvars"
```

After deployment, Terraform will output:
- DynamoDB table name
- Cognito User Pool ID and Client ID
- API Gateway URL
- Lambda function name

Update your frontend `.env` file with these values for local development, or configure them in the Netlify dashboard for each deployment context.

### Create Cognito Users

Listers must be created manually in AWS Cognito:

```bash
# Using AWS CLI
aws cognito-idp admin-create-user \
  --user-pool-id <user-pool-id> \
  --username <email> \
  --user-attributes Name=email,Value=<email> Name=email_verified,Value=true \
  --temporary-password <temp-password>

# Or use the AWS Console:
# 1. Go to Cognito User Pool
# 2. Click "Create user"
# 3. Enter email and temporary password
# 4. User will be prompted to change password on first login
```

## Deployment

This project uses a **gitflow deployment strategy** with separate dev and prod branches:

- **dev** - Development environment (default branch)
- **prod** - Production environment

### Gitflow Workflow

1. **Development**: All new features and fixes are developed on the `dev` branch or feature branches merged into `dev`
2. **Staging**: The `dev` branch automatically deploys to the development environment
3. **Production**: When ready for production, merge `dev` into `prod` to trigger production deployment

### Automated Deployment (GitHub Actions)

The project automatically deploys when you push to either `dev` or `prod` branches:

- **Push to dev** → Deploys to development environment using `terraform/environments/dev.tfvars`
- **Push to prod** → Deploys to production environment using `terraform/environments/prod.tfvars`

The deployment workflow:
1. Builds the backend Lambda functions
2. Deploys AWS infrastructure via Terraform
3. Builds the frontend with environment-specific configuration
4. Deploys to Netlify (development or production context)

### Backend Deployment

The backend is deployed automatically via Terraform when you run `terraform apply`. To update just the Lambda function:

```bash
cd backend
npm run build

cd ../terraform
# For development
terraform apply -var-file="environments/dev.tfvars" -target=aws_lambda_function.api_handler

# For production
terraform apply -var-file="environments/prod.tfvars" -target=aws_lambda_function.api_handler
```

### Frontend Deployment (Netlify)

#### Option 1: Automatic Deployment (Recommended)

Netlify is configured via `netlify.toml` to automatically deploy based on git branches:

- **dev branch** → Development deployment
- **prod branch** → Production deployment
- **Pull requests** → Deploy previews
- **Feature branches** → Branch deploys

Configuration is in `netlify.toml` with separate contexts for dev and production.

#### Option 2: Manual Deployment

```bash
cd frontend
npm run build

# Deploy dist/ folder to Netlify CLI
npx netlify deploy --prod  # for production
npx netlify deploy         # for preview
```

#### Netlify Setup

1. Connect your Git repository to Netlify
2. Set the default branch to **dev**
3. Configure build settings (automatically read from netlify.toml):
   - Build command: `npm install && npm run build`
   - Publish directory: `frontend/dist`
   - Base directory: `frontend`
4. Add environment variables in Netlify dashboard:
   - `VITE_API_URL`
   - `VITE_COGNITO_USER_POOL_ID`
   - `VITE_COGNITO_CLIENT_ID`
   - `VITE_COGNITO_REGION`
5. Netlify will auto-deploy on every push to dev or prod branches

## API Endpoints

### Authenticated Endpoints (Listers)

```
GET    /lists                     # Get all lists for user
POST   /lists                     # Create new list
GET    /lists/:listId             # Get list details
PUT    /lists/:listId             # Update list
DELETE /lists/:listId             # Delete list

GET    /lists/:listId/gifts       # Get all gifts for list
POST   /lists/:listId/gifts       # Create gift
PUT    /gifts/:giftId             # Update gift
DELETE /gifts/:giftId             # Delete gift
PUT    /gifts/:giftId/reorder     # Update sort order
POST   /gifts/:giftId/unclaim     # Remove claim
```

### Public Endpoints (Gifters)

```
GET    /public/lists/:shareCode        # Get list by share code
GET    /public/lists/:shareCode/gifts  # Get gifts
POST   /public/gifts/:giftId/claim     # Claim a gift
```

## Environment Variables

### Frontend

```env
VITE_API_URL=<api-gateway-url>
VITE_COGNITO_USER_POOL_ID=<cognito-pool-id>
VITE_COGNITO_CLIENT_ID=<cognito-client-id>
VITE_COGNITO_REGION=us-east-1
```

### Backend (Lambda)

These are set automatically by Terraform:

```env
DYNAMODB_TABLE_NAME=gift-lists-dev
COGNITO_USER_POOL_ID=<cognito-pool-id>
AWS_REGION=us-east-1
CORS_ORIGIN=https://your-app.netlify.app
```

## Testing

### Frontend Tests

```bash
cd frontend
npm test
```

### Backend Tests

```bash
cd backend
npm test
```

## Database Schema (DynamoDB)

Single-table design with the following access patterns:

| Entity | PK | SK | GSI1PK | GSI1SK | GSI2PK | GSI2SK |
|--------|----|----|--------|--------|--------|--------|
| List | LIST#\<id\> | METADATA | OWNER#\<userId\> | CREATED#\<ts\> | SHARE#\<code\> | CREATED#\<ts\> |
| Gift | LIST#\<listId\> | GIFT#\<id\> | GIFT#\<id\> | LIST#\<listId\> | - | - |

## Cost Estimation

**Monthly AWS costs (typical family usage):**
- DynamoDB: ~$0.15
- Lambda: ~$0.05
- API Gateway: ~$0.10
- Cognito: Free (< 50,000 MAUs)
- CloudWatch: ~$4.00

**Total: ~$5-10/month**

## Security

- Cognito JWT tokens for authentication
- API Gateway authorizer validates tokens
- Server-side validation on all inputs
- CORS configured for frontend domain
- Share codes use cryptographically random tokens
- Rate limiting on public endpoints
- DynamoDB conditional writes prevent race conditions

## Monitoring

- CloudWatch Logs for Lambda and API Gateway
- CloudWatch Metrics for performance monitoring
- Point-in-time recovery enabled for DynamoDB

## Troubleshooting

### Frontend can't connect to API

1. Check VITE_API_URL in .env matches API Gateway URL
2. Verify CORS is configured correctly in Terraform
3. Check browser console for specific errors

### Authentication not working

1. Verify Cognito User Pool ID and Client ID in .env
2. Ensure user exists in Cognito User Pool
3. Check user has confirmed their email
4. Try clearing browser cookies/localStorage

### DynamoDB access errors

1. Verify Lambda has correct IAM permissions
2. Check DYNAMODB_TABLE_NAME environment variable
3. Ensure table exists in correct region

## Contributing

This project follows a gitflow workflow:

1. Create a feature branch from `dev`
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Run tests
   ```bash
   cd frontend && npm test
   cd ../backend && npm test
   ```
4. Commit and push your feature branch
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin feature/your-feature-name
   ```
5. Submit a pull request to merge into `dev`
6. After review and testing in dev, create a PR from `dev` to `prod` for production release

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
