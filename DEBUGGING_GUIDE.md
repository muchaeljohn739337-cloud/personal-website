# Debugging Guide

This guide provides comprehensive debugging instructions for the Advancia PayLedger project.

## Quick Start

### VS Code / Cursor Debugging

1. **Open Debug Panel**: Press `F5` or go to Run and Debug (Ctrl+Shift+D)
2. **Select Configuration**: Choose from available debug configurations
3. **Set Breakpoints**: Click in the gutter next to line numbers
4. **Start Debugging**: Press `F5` or click the green play button

## Available Debug Configurations

### 1. Next.js: debug server-side

- **Purpose**: Debug Next.js server-side code
- **Usage**: Starts the dev server with debugging enabled
- **Breakpoints**: Works in API routes, server components, and middleware

### 2. Next.js: debug client-side

- **Purpose**: Debug React components in the browser
- **Usage**: Opens Chrome DevTools for client-side debugging
- **Breakpoints**: Works in client components and browser code

### 3. Next.js: debug full stack

- **Purpose**: Debug both server and client simultaneously
- **Usage**: Starts server and automatically opens Chrome for client debugging
- **Breakpoints**: Works everywhere

### 4. Debug Database Connection

- **Purpose**: Test and debug database connectivity
- **Usage**: Runs the database connection test script
- **Location**: `scripts/test-db-connection.ts`

### 5. Debug Test DB (JS)

- **Purpose**: Test database connection using JavaScript
- **Usage**: Runs the simple database test script
- **Location**: `scripts/test-db.js`

### 6. Debug TypeScript

- **Purpose**: Check TypeScript compilation errors
- **Usage**: Runs type checking without emitting files
- **Command**: `npm run type-check`

### 7. Debug ESLint

- **Purpose**: Check code quality and linting errors
- **Usage**: Runs ESLint on all files
- **Command**: `npm run lint`

### 8. Attach to Next.js

- **Purpose**: Attach debugger to a running Next.js process
- **Usage**: Use when Next.js is already running with `NODE_OPTIONS='--inspect'`

## Keyboard Shortcuts

### VS Code / Cursor

- `F5` - Start/Continue debugging
- `F9` - Toggle breakpoint
- `F10` - Step over
- `F11` - Step into
- `Shift+F11` - Step out
- `Ctrl+Shift+F5` - Restart debugging
- `Shift+F5` - Stop debugging

### Browser DevTools

- `F12` - Open DevTools
- `Ctrl+Shift+I` - Open DevTools (Windows/Linux)
- `Cmd+Option+I` - Open DevTools (Mac)

## Common Debugging Scenarios

### 1. Debugging API Routes

```typescript
// app/api/example/route.ts
export async function GET(request: Request) {
  // Set breakpoint here
  const data = await fetchData();
  return Response.json(data);
}
```

**Steps:**

1. Set breakpoint in the API route
2. Select "Next.js: debug server-side"
3. Start debugging (F5)
4. Make a request to the API endpoint
5. Debugger will pause at breakpoint

### 2. Debugging React Components

```typescript
// app/components/Example.tsx
'use client';

export function Example() {
  // Set breakpoint here
  const [state, setState] = useState(0);
  return <div>{state}</div>;
}
```

**Steps:**

1. Set breakpoint in the component
2. Select "Next.js: debug client-side"
3. Start debugging (F5)
4. Interact with the component
5. Debugger will pause at breakpoint

### 3. Debugging Database Issues

```bash
# Run database test
npm run test:db

# Or use debug configuration
# Select "Debug Database Connection" and press F5
```

**Common Issues:**

- Connection timeout → Check DATABASE_URL
- SSL errors → Verify SSL configuration
- Authentication failed → Check credentials

### 4. Debugging TypeScript Errors

```bash
# Run type check
npm run type-check

# Or use debug configuration
# Select "Debug TypeScript" and press F5
```

**Common Fixes:**

- Missing type definitions → Install `@types/package-name`
- Type mismatches → Check Prisma schema and types
- Import errors → Verify path aliases in `tsconfig.json`

### 5. Debugging Web3Auth Issues

```typescript
// lib/web3auth/provider.tsx
useEffect(() => {
  const init = async () => {
    // Set breakpoint here
    const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;
    // ...
  };
  init();
}, []);
```

**Checklist:**

- ✅ `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` is set in `.env.local`
- ✅ Client ID is not truncated (should be ~100+ characters)
- ✅ Network matches Web3Auth dashboard configuration
- ✅ Browser console shows initialization logs

### 6. Debugging Build Errors

```bash
# Run build
npm run build

# Check specific errors
npm run type-check
npm run lint
```

**Common Issues:**

- Type errors → Fix TypeScript issues
- Lint errors → Run `npm run lint:fix`
- Missing dependencies → Run `npm install`

## Environment Variables

### Required for Debugging

```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Web3Auth
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=...
WEB3AUTH_NETWORK=mainnet

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
```

### Check Environment Variables

```bash
# Verify .env.local exists
ls .env.local

# Test database connection
npm run test:db

# Verify environment
npm run test:env
```

## Debugging Tools

### 1. Console Logging

```typescript
console.log('Debug:', variable);
console.error('Error:', error);
console.warn('Warning:', warning);
console.table(data); // For arrays/objects
```

### 2. React DevTools

- Install React DevTools browser extension
- Inspect component props and state
- View component hierarchy

### 3. Network Tab

- Open DevTools → Network tab
- Monitor API requests
- Check request/response headers and bodies
- Identify slow requests

### 4. Performance Monitoring

```typescript
// Measure performance
const start = performance.now();
// ... code ...
const end = performance.now();
console.log(`Time: ${end - start}ms`);
```

## Troubleshooting

### Debugger Not Attaching

1. Check if port 9229 is available
2. Verify `NODE_OPTIONS='--inspect'` is set
3. Try restarting the debugger

### Breakpoints Not Hitting

1. Verify source maps are enabled
2. Check if code is actually running
3. Ensure breakpoint is in executable code (not comments/whitespace)

### TypeScript Errors Persist

1. Restart TypeScript server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
2. Clear `.next` folder: `rm -rf .next`
3. Reinstall dependencies: `rm -rf node_modules && npm install`

### Database Connection Fails

1. Verify DATABASE_URL is correct
2. Check if database is running
3. Test connection: `npm run test:db`
4. Check firewall/network settings

## Advanced Debugging

### Debugging Production Builds

```bash
# Build with source maps
npm run build

# Start production server
npm start

# Attach debugger
# Use "Attach to Next.js" configuration
```

### Remote Debugging

1. Start Next.js with remote debugging:

   ```bash
   NODE_OPTIONS='--inspect=0.0.0.0:9229' npm run dev
   ```

2. Connect from remote machine:
   - Use VS Code Remote Debugging
   - Or Chrome DevTools: `chrome://inspect`

### Debugging Tests

```bash
# Run tests in watch mode
npm run test:watch

# Debug specific test
npm run test -- --testNamePattern="test name"
```

## Resources

- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Next.js Debugging](https://nextjs.org/docs/advanced-features/debugging)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [React DevTools](https://react.dev/learn/react-developer-tools)

## Getting Help

If you encounter issues:

1. Check the console for error messages
2. Review this debugging guide
3. Check project documentation
4. Search for similar issues in GitHub issues
5. Ask for help with specific error messages and steps to reproduce
