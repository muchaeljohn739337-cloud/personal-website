# Vercel Cron Jobs Setup Guide

## Overview

This guide explains how to set up and use cron jobs in your Vercel-deployed Next.js application.

## Configuration

### 1. Environment Variables

Set the following environment variable in your Vercel dashboard:

- `CRON_SECRET`: A secure random string used to authenticate cron requests
  - Generate with: `openssl rand -base64 32`
  - Example: `CRON_SECRET=your-secure-random-string-here`

### 2. Vercel Configuration

The `vercel.json` file is already configured with:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 10 * * *"
    }
  ]
}
```

This runs the cron job daily at 10:00 AM UTC.

## Cron Job Handler

### Location

`frontend/src/app/api/cron/route.ts`

### Features

- ✅ POST method restriction
- ✅ Bearer token authentication with `CRON_SECRET`
- ✅ TypeScript support
- ✅ Error handling with proper logging
- ✅ Example backend health check
- ✅ Extensible for custom tasks

### Security

- Only accepts POST requests
- Requires `Authorization: Bearer <CRON_SECRET>` header
- Returns 401 for unauthorized requests
- Returns 405 for non-POST methods

## Testing

### Manual Testing

Test the cron endpoint manually:

```bash
curl -X POST https://your-app.vercel.app/api/cron \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

### Expected Response

```json
{
  "message": "Hello Cron!",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "status": "success",
  "executed": true
}
```

## Customization

### Adding Custom Tasks

Edit the cron handler to add your own scheduled tasks:

```typescript
// Add your custom cron logic here
// Examples:
// - Clean up old sessions
// - Send daily reports
// - Process pending transactions
// - Update analytics data
```

### Changing Schedule

Modify the cron schedule in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 */6 * * *" // Every 6 hours
    }
  ]
}
```

Common cron expressions:

- `"0 10 * * *"` - Daily at 10:00 AM UTC
- `"0 */6 * * *"` - Every 6 hours
- `"0 0 * * 1"` - Weekly on Monday at midnight
- `"0 0 1 * *"` - Monthly on the 1st

## Monitoring

### Logs

Monitor cron execution in Vercel dashboard:

1. Go to your project dashboard
2. Navigate to "Functions" tab
3. Check logs for `/api/cron` function

### Error Handling

The cron job includes comprehensive error handling:

- Network timeouts (10 seconds)
- Backend connectivity checks
- Proper error logging
- Graceful failure handling

## Environment Variables Reference

| Variable              | Required | Description                        |
| --------------------- | -------- | ---------------------------------- |
| `CRON_SECRET`         | Yes      | Secret key for cron authentication |
| `NEXT_PUBLIC_API_URL` | Optional | Backend API URL for health checks  |

## Troubleshooting

### Common Issues

1. **401 Unauthorized**

   - Check `CRON_SECRET` environment variable
   - Verify Authorization header format: `Bearer <secret>`

2. **405 Method Not Allowed**

   - Ensure you're using POST method
   - Vercel cron service uses POST internally

3. **Timeout Errors**

   - Backend health check has 10-second timeout
   - Consider increasing if needed

4. **Missing Environment Variables**
   - Set `CRON_SECRET` in Vercel dashboard
   - Redeploy after adding environment variables

### Debugging

- Check Vercel function logs
- Check Vercel function logs
- Test manually with curl
- Verify environment variables are set correctly
