# CI/CD Setup Guide

This document provides step-by-step instructions for setting up the complete CI/CD pipeline for the Gift List application, including all required accounts, credentials, and environment variables.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Step 1: AWS Account Setup](#step-1-aws-account-setup)
- [Step 2: AWS IAM User for Terraform/CI](#step-2-aws-iam-user-for-terraformci)
- [Step 3: Netlify Account Setup](#step-3-netlify-account-setup)
- [Step 4: GitHub Repository Setup](#step-4-github-repository-setup)
- [Step 5: Deploy Infrastructure with Terraform](#step-5-deploy-infrastructure-with-terraform)
- [Step 6: Configure Netlify Environment Variables](#step-6-configure-netlify-environment-variables)
- [Step 7: Configure GitHub Actions Secrets](#step-7-configure-github-actions-secrets)
- [Step 8: Create Initial Cognito Users](#step-8-create-initial-cognito-users)
- [Step 9: Test the Deployment](#step-9-test-the-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- [ ] Git installed locally
- [ ] Node.js 20+ installed
- [ ] Terraform 1.6+ installed
- [ ] AWS CLI installed and configured
- [ ] A GitHub account
- [ ] An AWS account (or ability to create one)
- [ ] A Netlify account (or ability to create one)

---

## Step 1: AWS Account Setup

### 1.1 Create AWS Account (if needed)

1. Go to [https://aws.amazon.com/](https://aws.amazon.com/)
2. Click "Create an AWS Account"
3. Follow the registration process
4. Provide payment information (free tier available)
5. Verify your identity
6. Select "Basic Support - Free" plan

### 1.2 Verify Account Access

```bash
# Check if you can access AWS console
# Log in at: https://console.aws.amazon.com/
```

---

## Step 2: AWS IAM User for Terraform/CI

You'll need an IAM user with programmatic access for Terraform and GitHub Actions.

### 2.1 Create IAM User

1. Log in to AWS Console
2. Navigate to **IAM** → **Users** → **Add users**
3. User details:
   - **Username**: `gift-list-ci`
   - **Access type**: Check "Programmatic access"
4. Click **Next: Permissions**

### 2.2 Attach Policies

Attach the following managed policies:

- `AmazonDynamoDBFullAccess`
- `AmazonCognitoPowerUser`
- `AWSLambda_FullAccess`
- `AmazonAPIGatewayAdministrator`
- `IAMFullAccess` (for creating Lambda execution roles)

**Note**: For production, create a custom policy with least-privilege permissions.

### 2.3 Create and Save Access Keys

1. Complete the user creation
2. On the success screen, **Download .csv** with credentials
3. Save these securely - you'll need them for GitHub Actions:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

### 2.4 Configure AWS CLI Locally

```bash
aws configure --profile gift-list

# Enter when prompted:
AWS Access Key ID: <your-access-key-id>
AWS Secret Access Key: <your-secret-access-key>
Default region name: us-east-1
Default output format: json
```

Test the configuration:
```bash
aws sts get-caller-identity --profile gift-list
```

---

## Step 3: Netlify Account Setup

### 3.1 Create Netlify Account

1. Go to [https://www.netlify.com/](https://www.netlify.com/)
2. Click "Sign up" (you can sign up with GitHub for easier integration)
3. Verify your email address

### 3.2 Create a New Site

1. In Netlify dashboard, click **Add new site** → **Import an existing project**
2. Connect to your Git provider (GitHub)
3. Authorize Netlify to access your repositories
4. Select the `gift-list` repository
5. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `frontend/dist`
   - **Production branch**: `prod`
6. Click **Deploy site**

### 3.3 Enable Branch Deploys

1. Go to **Site settings** → **Build & deploy** → **Continuous deployment**
2. Under **Branch deploys**, select:
   - **Deploy only these branches**: `dev`, `prod`
3. Save settings

### 3.4 Get Netlify Credentials

#### Get Site ID:
1. In your site dashboard, go to **Site settings** → **General**
2. Copy the **Site ID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
3. Save this as `NETLIFY_SITE_ID`

#### Get Authentication Token:
1. Click your profile picture → **User settings**
2. Navigate to **Applications** → **Personal access tokens**
3. Click **New access token**
4. Description: `gift-list-ci`
5. Click **Generate token**
6. Copy the token immediately (you won't see it again)
7. Save this as `NETLIFY_AUTH_TOKEN`

---

## Step 4: GitHub Repository Setup

### 4.1 Create Repository (if not already created)

```bash
# If starting fresh:
git init
git add .
git commit -m "Initial commit"
gh repo create gift-list --private --source=. --remote=origin
git push -u origin main
```

### 4.2 Create Gitflow Branches

```bash
# Create dev branch
git checkout -b dev
git push -u origin dev

# Create prod branch
git checkout -b prod
git push -u origin prod

# Set dev as default branch
gh repo edit --default-branch dev
```

### 4.3 Enable GitHub Actions

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Actions** → **General**
3. Under **Actions permissions**, select:
   - **Allow all actions and reusable workflows**
4. Save

---

## Step 5: Deploy Infrastructure with Terraform

### 5.1 Initialize Terraform

```bash
cd terraform
terraform init
```

### 5.2 Deploy Development Environment

```bash
# Review the plan
terraform plan -var-file="environments/dev.tfvars"

# Apply (type 'yes' when prompted)
terraform apply -var-file="environments/dev.tfvars"
```

This will create:
- DynamoDB table (`gift-lists-dev`)
- Cognito User Pool and Client
- Lambda function
- API Gateway
- IAM roles and policies

### 5.3 Capture Terraform Outputs

```bash
terraform output
```

Save these outputs - you'll need them for environment variables:

```bash
# Save to a temporary file for reference
terraform output > ../terraform-outputs-dev.txt
```

Expected outputs:
- `api_url`: API Gateway endpoint URL
- `cognito_user_pool_id`: Cognito User Pool ID
- `cognito_client_id`: Cognito App Client ID
- `dynamodb_table_name`: DynamoDB table name

### 5.4 Deploy Production Environment (Optional - do this later)

```bash
# Review the plan
terraform plan -var-file="environments/prod.tfvars"

# Apply (type 'yes' when prompted)
terraform apply -var-file="environments/prod.tfvars"

# Save outputs
terraform output > ../terraform-outputs-prod.txt
```

---

## Step 6: Configure Netlify Environment Variables

### 6.1 Set Development Environment Variables

1. Go to Netlify dashboard → Your site
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables with **dev** branch context:

| Variable Name | Value | Context |
|---------------|-------|---------|
| `VITE_API_URL` | `<api_url from Terraform output>` | `dev` branch |
| `VITE_COGNITO_USER_POOL_ID` | `<cognito_user_pool_id from Terraform>` | `dev` branch |
| `VITE_COGNITO_CLIENT_ID` | `<cognito_client_id from Terraform>` | `dev` branch |
| `VITE_COGNITO_REGION` | `us-east-1` | `dev` branch |

**How to add with branch context:**
1. Click **Add a variable**
2. Enter **Key** and **Value**
3. Under **Scopes**, select **Values by deploy context**
4. Choose **Branch: dev** from dropdown
5. Click **Save**

### 6.2 Set Production Environment Variables (when ready)

Repeat the process above but:
- Use values from `terraform-outputs-prod.txt`
- Set context to **Branch: prod**

### 6.3 Alternative: Use Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Link to your site
netlify link

# Set environment variables for dev
netlify env:set VITE_API_URL "<dev-api-url>" --context dev
netlify env:set VITE_COGNITO_USER_POOL_ID "<dev-pool-id>" --context dev
netlify env:set VITE_COGNITO_CLIENT_ID "<dev-client-id>" --context dev
netlify env:set VITE_COGNITO_REGION "us-east-1" --context dev
```

---

## Step 7: Configure GitHub Actions Secrets

GitHub Actions needs secrets to deploy infrastructure and frontend.

### 7.1 Add Repository Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each of the following secrets:

| Secret Name | Value | Where to Find |
|-------------|-------|---------------|
| `AWS_ACCESS_KEY_ID` | `<your-access-key-id>` | From Step 2.3 |
| `AWS_SECRET_ACCESS_KEY` | `<your-secret-access-key>` | From Step 2.3 |
| `NETLIFY_AUTH_TOKEN` | `<your-netlify-token>` | From Step 3.4 |
| `NETLIFY_SITE_ID` | `<your-site-id>` | From Step 3.4 |

### 7.2 Verify Secrets

After adding all secrets, you should see:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

**Note**: Secret values are hidden after creation - this is normal.

---

## Step 8: Create Initial Cognito Users

Listers (authenticated users) must be created manually in Cognito.

### 8.1 Get Cognito User Pool ID

```bash
# From Terraform outputs (dev environment)
cd terraform
terraform output cognito_user_pool_id
```

### 8.2 Create Admin User via AWS CLI

```bash
# Set variables
USER_POOL_ID="<your-user-pool-id>"
USER_EMAIL="admin@example.com"
TEMP_PASSWORD="TempPass123!"

# Create user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username $USER_EMAIL \
  --user-attributes \
    Name=email,Value=$USER_EMAIL \
    Name=email_verified,Value=true \
  --temporary-password $TEMP_PASSWORD \
  --message-action SUPPRESS \
  --profile gift-list

echo "User created:"
echo "Email: $USER_EMAIL"
echo "Temporary password: $TEMP_PASSWORD"
echo ""
echo "User must change password on first login"
```

### 8.3 Create User via AWS Console (Alternative)

1. Go to AWS Console → **Cognito** → **User Pools**
2. Select your user pool (e.g., `gift-list-dev-user-pool`)
3. Click **Users** → **Create user**
4. User details:
   - **Email address**: `admin@example.com`
   - **Mark email as verified**: ✓ Checked
   - **Temporary password**: Create one
   - **Send invitation**: Unchecked (if testing)
5. Click **Create user**

### 8.4 Test First Login

1. Navigate to your Netlify dev URL (e.g., `dev--<site-name>.netlify.app`)
2. Go to `/login`
3. Log in with:
   - **Email**: `admin@example.com`
   - **Password**: `<temporary-password>`
4. You'll be prompted to set a new password
5. After setting new password, you should be redirected to the dashboard

---

## Step 9: Test the Deployment

### 9.1 Test Development Deployment

```bash
# Make a small change
echo "# Test" >> README.md
git add README.md
git commit -m "Test dev deployment"
git push origin dev
```

**Verify:**
1. Go to GitHub → **Actions** tab
2. Watch the deployment workflow run
3. Verify all steps complete successfully
4. Check Netlify for new deployment
5. Visit the dev site URL and test functionality

### 9.2 Test Production Deployment (when ready)

```bash
# Merge dev to prod
git checkout prod
git pull origin prod
git merge dev
git push origin prod
```

**Verify:**
1. GitHub Actions runs for `prod` branch
2. Terraform deploys to production
3. Netlify deploys to production site
4. Test production URL

### 9.3 Manual Testing Checklist

- [ ] Login page loads
- [ ] Can log in with Cognito user
- [ ] Dashboard displays
- [ ] Can create a new list
- [ ] Can add gifts to list
- [ ] Can generate share code
- [ ] Public list view works (no auth required)
- [ ] Can claim a gift from public view
- [ ] Claimed gifts appear in lister's view

---

## Troubleshooting

### Terraform Errors

**Error: "Access Denied" or "Insufficient permissions"**
- Verify IAM user has all required policies (Step 2.2)
- Check AWS CLI is configured correctly: `aws sts get-caller-identity --profile gift-list`

**Error: "Resource already exists"**
- Someone may have deployed already
- Check for existing resources in AWS Console
- Consider using a different `environment` value in `.tfvars`

**Error: "Invalid credentials"**
- Run `aws configure --profile gift-list` again
- Verify access keys are correct

### Netlify Deployment Errors

**Error: "Build failed" or "Command not found"**
- Verify build settings:
  - Base directory: `frontend`
  - Build command: `npm install && npm run build`
  - Publish directory: `frontend/dist`

**Error: "Environment variable undefined"**
- Check environment variables are set for the correct branch context
- Verify variable names start with `VITE_` prefix

**Error: Build succeeds but app shows blank page**
- Open browser console for errors
- Check that `VITE_API_URL` is set correctly
- Verify CORS is configured in backend

### GitHub Actions Errors

**Error: "AWS credentials not found"**
- Verify secrets are added: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- Check secret names match exactly (case-sensitive)

**Error: "Netlify deployment failed"**
- Verify `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` are set
- Check token has not expired
- Regenerate token if needed (Step 3.4)

**Error: "Terraform backend initialization failed"**
- This is expected on first run
- Workflow should create backend automatically
- If persists, check Terraform configuration

### Login/Authentication Errors

**Error: "User does not exist"**
- Verify user was created in correct User Pool
- Check User Pool ID in Netlify environment variables matches Terraform output

**Error: "Incorrect username or password"**
- For new users, use temporary password first
- After first login, must set new permanent password
- Check Caps Lock is off

**Error: "Network error" when logging in**
- Verify `VITE_API_URL` is set correctly
- Check API Gateway endpoint is accessible
- Verify CORS settings in Lambda

### Getting Help

If you encounter issues not covered here:

1. Check CloudWatch Logs (Lambda):
   - AWS Console → CloudWatch → Log groups → `/aws/lambda/gift-list-<env>-api`

2. Check Netlify Deploy Logs:
   - Netlify dashboard → Deploys → [latest deploy] → Deploy log

3. Check GitHub Actions Logs:
   - GitHub repository → Actions → [latest run] → View logs

4. Common issues and solutions: [GitHub Issues](https://github.com/yourusername/gift-list/issues)

---

## Environment Reference

### Development Environment Summary

After completing setup, you should have:

**AWS Resources (via Terraform):**
- DynamoDB table: `gift-lists-dev`
- Cognito User Pool: `gift-list-dev-user-pool`
- Lambda function: `gift-list-dev-api`
- API Gateway: `gift-list-dev-api`

**Netlify:**
- Dev site: `dev--<site-name>.netlify.app`
- Connected to `dev` branch
- Environment variables configured

**GitHub:**
- Repository with `dev` and `prod` branches
- Actions secrets configured
- Automated deployments enabled

### Production Environment Summary (when deployed)

**AWS Resources:**
- DynamoDB table: `gift-lists-prod`
- Cognito User Pool: `gift-list-prod-user-pool`
- Lambda function: `gift-list-prod-api`
- API Gateway: `gift-list-prod-api`

**Netlify:**
- Production site: Custom domain or `<site-name>.netlify.app`
- Connected to `prod` branch

---

## Next Steps

After successful setup:

1. **Create Additional Users**: Follow Step 8 to create more Cognito users as needed

2. **Configure Custom Domain** (optional):
   - Netlify: Site settings → Domain management → Add custom domain

3. **Enable Monitoring**:
   - Set up CloudWatch alarms for Lambda errors
   - Configure Netlify notifications for failed deployments

4. **Security Hardening**:
   - Review IAM policies for least-privilege access
   - Enable MFA for AWS root account
   - Rotate access keys regularly

5. **Documentation**:
   - Share this guide with team members
   - Document any custom configurations
   - Update Terraform variables for your organization

---

## Maintenance

### Regular Tasks

**Monthly:**
- Review CloudWatch logs for errors
- Check for Terraform updates: `terraform version`
- Update dependencies: `npm outdated` (frontend and backend)

**Quarterly:**
- Rotate AWS access keys
- Review and update IAM policies
- Test disaster recovery procedures

**As Needed:**
- Update environment variables when infrastructure changes
- Add new Cognito users when team members join

### Updating Infrastructure

To update existing infrastructure:

```bash
cd terraform

# Dev environment
terraform plan -var-file="environments/dev.tfvars"
terraform apply -var-file="environments/dev.tfvars"

# Prod environment (after testing in dev)
terraform plan -var-file="environments/prod.tfvars"
terraform apply -var-file="environments/prod.tfvars"
```

---

**Last Updated**: 2026-01-06

For questions or issues, please refer to the [main README](README.md) or [CLAUDE.md](CLAUDE.md) documentation.
