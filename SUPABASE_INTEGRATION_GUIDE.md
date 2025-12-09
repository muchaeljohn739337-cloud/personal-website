# Supabase Integration Guide

## Overview

This guide covers the complete Supabase integration for the Advancia PayLedger platform, including database connections, authentication, and storage.

---

## Environment Variables

### Required Variables

Add these to your `.env.local` file:

```bash
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xesecqcqzykvmrtxrzqi.supabase.co

# Supabase Publishable Key (for client-side operations)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_dj1xLuksqBUvn9O6AWU3Fg_bRYa6ohq

# Supabase Anon Key (alternative, if publishable key not available)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Supabase Service Role Key (server-side only, never expose to client)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Database Connection - Connection Pooling (for application use)
DATABASE_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Database Connection - Direct (for migrations and Prisma)
DIRECT_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

### Getting Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

5. For Database Connection:
   - Go to **Settings** → **Database**
   - Under **Connection string**, select **Connection pooling**
   - Copy the connection string and replace `[YOUR-PASSWORD]` with your database password

---

## Client Utilities

### Server Components (`utils/supabase/server.ts`)

Use this in Server Components, Server Actions, and Route Handlers:

```typescript
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos, error } = await supabase.from('todos').select('*');

  if (error) {
    console.error('Error:', error);
    return <div>Error loading data</div>;
  }

  return (
    <ul>
      {todos?.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

### Client Components (`utils/supabase/client.ts`)

Use this in Client Components:

```typescript
'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

export default function ClientComponent() {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    const fetchTodos = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('todos').select('*');

      if (error) {
        console.error('Error:', error);
        return;
      }

      setTodos(data || []);
    };

    fetchTodos();
  }, []);

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

### Middleware (`utils/supabase/middleware.ts`)

Use this in Next.js Middleware for authentication:

```typescript
import { createClient } from '@/utils/supabase/middleware';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return supabaseResponse;
}
```

---

## Database Connection

### Using Supabase Connection Pooling (Recommended)

For better performance and connection management, use Supabase's connection pooler:

**Connection Pooling (DATABASE_URL) - For Application:**

```bash
DATABASE_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Direct Connection (DIRECT_URL) - For Migrations:**

```bash
DIRECT_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

**Benefits of Connection Pooling:**

- Better connection management
- Improved performance
- Automatic connection pooling
- Reduced connection overhead
- Handles high concurrency better

**When to Use Each:**

- **DATABASE_URL (Pooling):** Use for all application queries and operations
- **DIRECT_URL (Direct):** Use for Prisma migrations and schema operations

### Direct Connection (Alternative)

If you need a direct connection:

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xesecqcqzykvmrtxrzqi.supabase.co:5432/postgres
```

**Note:** Direct connections have connection limits. Use pooling for production.

---

## Storage Integration

The platform includes a Supabase Storage integration for file uploads:

```typescript
import { getSupabaseStorage } from '@/lib/storage/supabase';

const storage = getSupabaseStorage();

// Upload a file
const { data, error } = await storage.uploadFile({
  bucket: 'user-avatars',
  path: 'user-123/avatar.jpg',
  file: fileBuffer,
  options: {
    contentType: 'image/jpeg',
    upsert: true,
  },
});
```

---

## Authentication

Supabase provides built-in authentication. You can use it alongside or instead of NextAuth:

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Get current user
const {
  data: { user },
} = await supabase.auth.getUser();

// Sign out
await supabase.auth.signOut();
```

---

## Real-time Subscriptions

Supabase supports real-time subscriptions:

```typescript
const supabase = createClient();

const channel = supabase
  .channel('todos')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'todos',
    },
    (payload) => {
      console.log('New todo:', payload.new);
    }
  )
  .subscribe();
```

---

## Security Best Practices

1. **Never expose service role key to client:**
   - Only use `SUPABASE_SERVICE_ROLE_KEY` in server-side code
   - Never include it in client components

2. **Use Row Level Security (RLS):**
   - Enable RLS on your Supabase tables
   - Create policies to restrict access

3. **Validate environment variables:**
   - Always check if variables exist before using
   - Use TypeScript for type safety

4. **Connection pooling:**
   - Use connection pooling in production
   - Monitor connection usage

---

## Troubleshooting

### Connection Issues

**Error:** `Can't reach database server`

**Solutions:**

1. Verify `DATABASE_URL` is correct
2. Check if password is URL-encoded
3. Ensure connection pooler URL is used (port 6543)
4. Verify firewall rules allow connections

### Authentication Issues

**Error:** `Invalid API key`

**Solutions:**

1. Verify `NEXT_PUBLIC_SUPABASE_URL` matches your project
2. Check if key is correct (publishable vs service role)
3. Ensure key is not expired
4. Verify environment variables are loaded

### Storage Issues

**Error:** `Bucket not found`

**Solutions:**

1. Create bucket in Supabase Dashboard
2. Set bucket to public if needed
3. Verify storage policies are configured
4. Check service role key has storage access

---

## Example Files

See the following example files:

- `app/examples/supabase-server-example.tsx` - Server Component example
- `app/examples/supabase-client-example.tsx` - Client Component example

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Connection Pooling Guide](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd")  
**Status:** Production Ready
