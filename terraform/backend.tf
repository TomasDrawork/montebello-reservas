# IAM Role for Lambda Execution
resource "aws_iam_role" "lambda_role" {
  name = "montebello_lambda_role_${var.aws_region}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# AWS Lambda Function for Express Backend
resource "aws_lambda_function" "api_lambda" {
  filename         = "${path.module}/lambda.zip"
  function_name    = "montebello-reservas-api"
  role             = aws_iam_role.lambda_role.arn
  handler          = "server.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda.zip")
  runtime          = "nodejs20.x"
  timeout          = 15
  memory_size      = 256

  environment {
    variables = {
      NODE_ENV           = "production"
      MONTEBELLO_EMAIL   = "reservas.montebellovcp@gmail.com"
      GMAIL_APP_PASSWORD = "fepixwspdvunpxin"
    }
  }
}

# AWS API Gateway HTTP API
resource "aws_apigatewayv2_api" "http_api" {
  name          = "montebello-http-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["*"]
  }
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api_lambda.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "api_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /api/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_stage" "default_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_gw_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
