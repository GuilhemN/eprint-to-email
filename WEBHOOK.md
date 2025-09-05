# RSS-to-Email Webhook API

The webhook service provides HTTP endpoints to trigger email generation remotely.

## Endpoints

### POST /trigger-email

**Description**: Triggers email generation and optionally sends the email.

**Authentication**: Requires a secret key passed as query parameter or in request body.

**Parameters**:

- `key` (required): Webhook secret key
- `send` (optional): Whether to send the email after generation (default: `true` if email config is available, `false` otherwise)

**Examples**:

```bash
# Generate and send email
curl -X POST "http://localhost:8080/trigger-email?key=your-secret-key"

# Generate email but don't send it
curl -X POST "http://localhost:8080/trigger-email?key=your-secret-key&send=false"

# Using JSON body
curl -X POST "http://localhost:8080/trigger-email?key=your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"send": false}'
```

**Response Examples**:

Success (email sent):

```json
{
  "success": true,
  "message": "Email generated and sent successfully",
  "timestamp": "2025-09-05T03:00:00.000Z"
}
```

Success (email generated but not sent):

```json
{
  "success": true,
  "message": "Email generated successfully (not sent: email configuration missing)",
  "timestamp": "2025-09-05T03:00:00.000Z"
}
```

Error (unauthorized):

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing secret key"
}
```

### GET /health

**Description**: Health check endpoint.

**Response**:

```json
{
  "status": "ok",
  "timestamp": "2025-09-05T03:00:00.000Z"
}
```

## Configuration

Set these environment variables:

```bash
# Required for webhook
WEBHOOK_SECRET=your-secure-webhook-secret-key-here
WEBHOOK_PORT=8080  # Optional, defaults to 8080

# Required for email sending
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
MAIL_TO=recipient@example.com
FROM=sender@example.com
```

## Docker Usage

The webhook service is included in the docker-compose.yml:

```bash
# Start all services including webhook
docker-compose up -d

# Check webhook logs
docker-compose logs -f rss-webhook

# Test webhook
curl -X POST "http://localhost:8080/trigger-email?key=your-secret-key&send=false"
```

## Security Notes

- Always use a strong, unique webhook secret
- Consider using HTTPS in production
- The webhook server binds to `0.0.0.0` to work in Docker containers
- Rate limiting is not implemented - consider adding a reverse proxy with rate limiting for production use
