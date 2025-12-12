# Cloudflare KV Storage Testing Commands

## Test KV Functionality on Deployed Site

Use these curl commands to test the KV storage functionality on your deployed Cloudflare Pages site:

### 1. Test Basic Connectivity

```bash
curl -X POST https://advancia-platform.workers.dev/functions/test-kv \
  -H "Content-Type: application/json" \
  -d '{"action":"test"}'
```

### 2. Write Data to KV

```bash
curl -X POST https://advancia-platform.workers.dev/functions/test-kv \
  -H "Content-Type: application/json" \
  -d '{
    "action": "write",
    "key": "test:user123",
    "value": "{\"name\":\"John Doe\",\"balance\":1000,\"active\":true}"
  }'
```

### 3. Read Data from KV

```bash
curl -X POST https://advancia-platform.workers.dev/functions/test-kv \
  -H "Content-Type: application/json" \
  -d '{
    "action": "read",
    "key": "test:user123"
  }'
```

### 4. List Keys with Prefix

```bash
curl -X POST https://advancia-platform.workers.dev/functions/test-kv \
  -H "Content-Type: application/json" \
  -d '{
    "action": "list",
    "prefix": "test:"
  }'
```

### 5. Delete Data from KV

```bash
curl -X POST https://advancia-platform.workers.dev/functions/test-kv \
  -H "Content-Type: application/json" \
  -d '{
    "action": "delete",
    "key": "test:user123"
  }'
```

### 6. Run Full Test Suite

```bash
curl -X POST https://advancia-platform.workers.dev/functions/test-kv \
  -H "Content-Type: application/json" \
  -d '{"action":"full-suite"}'
```

## Expected Responses

- **Success**: `{"success":true,"data":"..."}` or `{"success":true,"message":"..."}`
- **Error**: `{"success":false,"error":"..."}`

## Troubleshooting

1. **404 Error**: Pages Functions not deployed or wrong URL path
2. **500 Error**: KV namespace not bound or function error
3. **Connection Timeout**: Site not accessible or DNS issues

## Verify Deployment

Check your Cloudflare Pages project status:

```bash
npx wrangler pages project list
npx wrangler pages deployment list --project-name advancia-frontend
```

## Manual Deployment (if needed)

If deployment failed, redeploy manually:

```bash
cd frontend
npx wrangler pages deploy . --project-name advancia-frontend
```
