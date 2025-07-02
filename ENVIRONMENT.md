# Environment Variables Configuration

This document describes all environment variables required for the Klimboys POS system.

## Development Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Required Variables

#### Authentication

- `BETTER_AUTH_SECRET`: A secure random string (min 32 characters) used for JWT signing
  - Generate with: `openssl rand -base64 32`
- `BETTER_AUTH_URL`: The base URL for authentication (e.g., `http://localhost:5173`)
- `PUBLIC_BASE_URL`: The public-facing URL of your application

#### Telegram Integration (Optional)

- `SECRET_TELEGRAM_BOT_TOKEN`: Bot token from @BotFather
- `SECRET_TELEGRAM_CHAT_ID`: Chat/Channel ID for notifications
- `SECRET_TELEGRAM_MESSAGE_THREAD_ID`: Thread ID for grouped messages

## Production Environment

For production deployment on Cloudflare Pages:

1. Copy `.env.production.example` to `.env.production`
2. Configure all required values
3. Add secrets via Cloudflare Dashboard or Wrangler CLI

### Setting Production Secrets

#### Via Cloudflare Dashboard:

1. Go to your Cloudflare Pages project
2. Navigate to Settings > Environment variables
3. Add each variable as a production secret

#### Via Wrangler CLI:

```bash
# Add individual secrets
wrangler pages secret put BETTER_AUTH_SECRET
wrangler pages secret put SECRET_TELEGRAM_BOT_TOKEN
wrangler pages secret put SECRET_TELEGRAM_CHAT_ID
wrangler pages secret put SECRET_TELEGRAM_MESSAGE_THREAD_ID

# List all secrets
wrangler pages secret list
```

## Cloudflare Bindings

These are automatically configured in `wrangler.jsonc`:

- `DB`: D1 Database binding for data storage
- `BUCKET`: R2 Storage binding for image uploads

## Security Best Practices

1. **Never commit** `.env` files to version control
2. **Use strong secrets**: Minimum 32 characters for auth secrets
3. **Rotate secrets regularly**: Especially after team member changes
4. **Limit access**: Use environment-specific secrets
5. **Monitor usage**: Check Cloudflare analytics for unusual patterns

## Troubleshooting

### Common Issues

1. **Authentication failures**

   - Verify `BETTER_AUTH_SECRET` matches between deployments
   - Check `BETTER_AUTH_URL` includes correct protocol (http/https)

2. **Telegram notifications not working**

   - Ensure bot has permission to send messages to the chat
   - Verify chat ID is correct (can be negative for groups)

3. **R2 upload failures**
   - Check R2 bucket exists and is properly bound
   - Verify CORS settings on R2 bucket allow your domain

### Verification Commands

```bash
# Check local environment
npm run check

# Test database connection
npm run db:studio

# Verify R2 binding
wrangler r2 bucket list

# Test Telegram integration (add to your code)
npm run test:telegram
```
