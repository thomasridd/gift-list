resource "aws_apigatewayv2_api" "gift_api" {
  name          = "${var.project_name}-api-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = [var.cors_origin]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.gift_api.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-authorizer"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.web.id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.listers.id}"
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id           = aws_apigatewayv2_api.gift_api.id
  integration_type = "AWS_PROXY"

  connection_type      = "INTERNET"
  integration_method   = "POST"
  integration_uri      = aws_lambda_function.api_handler.invoke_arn
  passthrough_behavior = "WHEN_NO_MATCH"
}

# Authenticated routes
resource "aws_apigatewayv2_route" "lists" {
  api_id    = aws_apigatewayv2_api.gift_api.id
  route_key = "GET /lists"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "create_list" {
  api_id    = aws_apigatewayv2_api.gift_api.id
  route_key = "POST /lists"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "get_list" {
  api_id    = aws_apigatewayv2_api.gift_api.id
  route_key = "GET /lists/{listId}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "update_list" {
  api_id    = aws_apigatewayv2_api.gift_api.id
  route_key = "PUT /lists/{listId}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "delete_list" {
  api_id    = aws_apigatewayv2_api.gift_api.id
  route_key = "DELETE /lists/{listId}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "get_gifts" {
  api_id    = aws_apigatewayv2_api.gift_api.id
  route_key = "GET /lists/{listId}/gifts"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "create_gift" {
  api_id    = aws_apigatewayv2_api.gift_api.id
  route_key = "POST /lists/{listId}/gifts"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "update_gift" {
  api_id    = aws_apigatewayv2_api.gift_api.id
  route_key = "PUT /gifts/{giftId}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "delete_gift" {
  api_id    = aws_apigatewayv2_api.gift_api.id
  route_key = "DELETE /gifts/{giftId}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "reorder_gift" {
  api_id    = aws_apigatewayv2_api.gift_api.id
  route_key = "PUT /gifts/{giftId}/reorder"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "unclaim_gift" {
  api_id    = aws_apigatewayv2_api.gift_api.id
  route_key = "POST /gifts/{giftId}/unclaim"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Public routes (no authentication)
resource "aws_apigatewayv2_route" "public_list" {
  api_id    = aws_apigatewayv2_api.gift_api.id
  route_key = "GET /public/lists/{shareCode}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "public_gifts" {
  api_id    = aws_apigatewayv2_api.gift_api.id
  route_key = "GET /public/lists/{shareCode}/gifts"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "claim_gift" {
  api_id    = aws_apigatewayv2_api.gift_api.id
  route_key = "POST /public/gifts/{giftId}/claim"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Health check
resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.gift_api.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.gift_api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }
}

resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}"
  retention_in_days = var.environment == "prod" ? 90 : 7
}
