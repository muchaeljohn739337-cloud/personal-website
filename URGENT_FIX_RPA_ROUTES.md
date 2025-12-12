# 🚨 URGENT: RPA Routes TypeScript Fix Required

## Current Status

❌ **Backend won't start** due to TypeScript compilation errors in `backend/src/routes/rpa.ts`

## The Problem

The `rpa.ts` route file tries to use a `status` field that **doesn't exist** in the `RPAWorkflow` Prisma model.

**Error:**

```
src/routes/rpa.ts:98:7 - error TS2353: Object literal may only specify known properties,
and 'status' does not exist in type 'RPAWorkflowData'.
```

## Root Cause

`RPAWorkflow` schema has these fields:

- ✅ `name` (required)
- ✅ `description` (optional)
- ✅ `trigger` (required, JSON)
- ✅ `actions` (required, JSON)
- ✅ `enabled` (optional, boolean)
- ✅ `createdById` (required)
- ❌ **NO `status` field** (only `RPAExecution` has status)

## Manual Fix Required

### File: `backend/src/routes/rpa.ts`

#### Fix 1: Line 87 (POST /workflows)

**FIND:**

```typescript
const { name, status } = req.body;
```

**REPLACE WITH:**

```typescript
const { name, description, trigger, actions, enabled, createdById } = req.body;
```

#### Fix 2: Lines 89-93 (validation)

**FIND:**

```typescript
if (!name) {
  return res.status(400).json({
    success: false,
    message: "Missing required field: name",
  });
}
```

**REPLACE WITH:**

```typescript
if (!name || !trigger || !actions || !createdById) {
  return res.status(400).json({
    success: false,
    message: "Missing required fields: name, trigger, actions, createdById",
  });
}

// Validate trigger structure
if (typeof trigger !== "object" || !trigger.type) {
  return res.status(400).json({
    success: false,
    message: "Invalid trigger format. Must be an object with 'type' field",
  });
}

// Validate actions structure
if (!Array.isArray(actions) || actions.length === 0) {
  return res.status(400).json({
    success: false,
    message: "Actions must be a non-empty array",
  });
}
```

#### Fix 3: Lines 96-99 (createWorkflow call)

**FIND:**

```typescript
const workflow = await createWorkflow({
  name,
  status,
});
```

**REPLACE WITH:**

```typescript
const workflow = await createWorkflow({
  name,
  description,
  trigger,
  actions,
  enabled: enabled !== false,
  createdById,
});
```

#### Fix 4: Line 117 (PATCH /workflows/:id)

**FIND:**

```typescript
const { name, status } = req.body;
```

**REPLACE WITH:**

```typescript
const { name, description, trigger, actions, enabled } = req.body;
```

#### Fix 5: Lines 119-122 (updateWorkflow call)

**FIND:**

```typescript
const workflow = await updateWorkflow(id, {
  name,
  status,
});
```

**REPLACE WITH:**

```typescript
// Build update object with only provided fields
const updateData: any = {};
if (name !== undefined) updateData.name = name;
if (description !== undefined) updateData.description = description;
if (trigger !== undefined) updateData.trigger = trigger;
if (actions !== undefined) updateData.actions = actions;
if (enabled !== undefined) updateData.enabled = enabled;

if (Object.keys(updateData).length === 0) {
  return res.status(400).json({
    success: false,
    message: "No fields to update",
  });
}

const workflow = await updateWorkflow(id, updateData);
```

## Verification Steps

After making the changes:

```powershell
# 1. Verify TypeScript compiles
cd backend
npx tsc --noEmit

# 2. Start the backend
npm run dev

# 3. Seed the workflows
node scripts/seedRPA-simple.mjs

# 4. Test with curl or Invoke-RestMethod
$token = "YOUR_ADMIN_JWT"
Invoke-RestMethod -Uri "http://localhost:4000/api/rpa/workflows" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Method GET
```

## Expected Output

✅ Backend starts without errors
✅ "Server is running on port 4000"
✅ 3 workflows seeded successfully
✅ API returns workflow list

## Next Steps After Fix

1. ✅ Fix `rpa.ts` (manual editing required)
2. Commit the fix: `git add backend/src/routes/rpa.ts && git commit -m "fix: correct RPA route schema fields"`
3. Push: `git push`
4. Create PR on GitHub
5. Merge PR
6. Render auto-deploys from main
7. Run seed script on production

## Why Automated Fix Failed

PowerShell regex replacements with multi-line code blocks introduced syntax errors (extra braces). Manual editing in VS Code is more reliable for this type of change.

---

**⏱️ Estimated time to fix manually: 5 minutes**
**📝 Open `backend/src/routes/rpa.ts` in VS Code and apply the 5 fixes above**
