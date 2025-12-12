# Coding Patterns & Conventions

## Brief Overview

Coding standards and patterns specific to Advancia PayLedger development.

## Import Conventions

Always use path aliases instead of relative imports:

```typescript
import { prisma } from '@/lib/prismaClient';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
```

## Component Pattern

```tsx
'use client'; // Required for client components

import { cn } from '@/lib/utils/cn';

export function Component({ className, ...props }) {
  return <div className={cn('base-classes', className)} {...props} />;
}
```

## API Route Pattern

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Implementation
}
```

## Validation with Zod

Use existing schemas in `lib/validations/` - see `lib/validations/auth.ts` for examples.

## Styling

- Tailwind CSS for all styling
- Use `cn()` utility for class merging
- Follow shadcn/ui component patterns
- Never use inline styles

## TypeScript

- Strict mode enabled
- Avoid `any` types - use proper typing
- Export types alongside components when needed
- Use Zod for runtime validation
