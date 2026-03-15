# Cognito resources removed - authentication now uses Google OAuth2.
# If you need to remove existing Cognito resources from Terraform state, run:
#   terraform state rm aws_cognito_user_pool.listers
#   terraform state rm aws_cognito_user_pool_client.web
