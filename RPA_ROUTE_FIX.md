# RPA Route Fix Required

## Problem

The `backend/src/routes/rpa.ts` file has TypeScript errors because it's passing a `status` field that doesn't exist in the `RPAWorkflow` Prisma model.

## Errors Found

```
src/routes/rpa.ts:98:7 - error TS2353: Object literal may only specify known properties, and 'status' does not exist in type 'RPAWorkflowData'.
src/routes/rpa.ts:121:7 - error TS2353: Object literal may only specify known properties, and 'status' does not exist in type 'Partial<RPAWorkflowData>'.
```

## Root Cause

Lines 87-99 and 116-122 in `rpa.ts` are trying to use a `status` field, but the Prisma schema shows `RPAWorkflow` has:

- `name`: string (required)
- `description`: string (optional)
- `trigger`: Json (required)
- `actions`: Json (required)
- `enabled`: Boolean (optional, defaults to true)
- `createdById`: string (required)

There is NO `status` field in `RPAWorkflow`. Only `RPAExecution` has a `status` field.

## Fix Required

###backend/src/routes/rpa.ts - Line 85-110 (POST /workflows)
**Replace:**

```typescript
router.post("/workflows", async (req: Request, res: Response) => {
  try {
    const { name, status } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: name",
      });
    }

    const workflow = await createWorkflow({
      name,
      status,
    });
```

**With:**

```typescript
router.post("/workflows", async (req: Request, res: Response) => {
  try {
    const { name, description, trigger, actions, enabled, createdById } = req.body;

    if (!name || !trigger || !actions || !createdById) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, trigger, actions, createdById",
      });
    }

    const workflow = await createWorkflow({
      name,
      description,
      trigger,
      actions,
      enabled,
      createdById,
    });
```

### backend/src/routes/rpa.ts - Line 112-125 (PATCH /workflows/:id)

**Replace:**

```typescript
router.patch("/workflows/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const workflow = await updateWorkflow(id, {
      name,
      status,
    });
```

**With:**

```typescript
router.patch("/workflows/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, trigger, actions, enabled } = req.body;

    const workflow = await updateWorkflow(id, {
      name,
      description,
      trigger,
      actions,
      enabled,
    });
```

## Testing After Fix

1. Start backend: `cd backend && npm run dev`
2. Seed workflows: `node backend/scripts/seedRPA-simple.mjs`
3. Test endpoints with admin JWT token

## Commands to Apply Fix

```powershell
# The route file needs manual editing since we don't have file editing tools
# Open backend/src/routes/rpa.ts and apply the changes above
```
