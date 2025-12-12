# Cloudflare R2 Storage Integration

## Setup Complete ✅

I've implemented Cloudflare R2 object storage for your Advancia Pay Ledger platform with zero egress charges.

### What Was Added:

1. **R2 Storage Service** (`backend/src/services/r2Storage.ts`)

   - Upload files to R2
   - Generate presigned URLs for secure access
   - Download and delete files
   - File metadata management

2. **File Upload API** (`backend/src/routes/files.ts`)

   - `POST /api/files/upload` - Upload files (images, PDFs, documents)
   - `GET /api/files/:fileId` - Get file with presigned URL
   - `GET /api/files` - List user's files
   - `DELETE /api/files/:fileId` - Delete files

3. **Next.js Config Fix** (`frontend/next.config.js`)
   - Fixed localhost startup issue
   - Conditional `output: "export"` only for Cloudflare Pages builds
   - Rewrites work in development mode
   - Turbopack root configuration for monorepo

### Setup Instructions:

#### 1. Create R2 Bucket (Cloudflare Dashboard)

```bash
1. Go to: https://dash.cloudflare.com/ → R2
2. Click "Create bucket"
3. Name: "advancia-documents"
4. Click "Create bucket"
```

#### 2. Generate R2 API Token

```bash
1. Go to: R2 → Manage R2 API Tokens
2. Click "Create API Token"
3. Name: "Advancia Backend"
4. Permissions: "Object Read & Write"
5. Copy: Access Key ID & Secret Access Key
```

#### 3. Configure Environment Variables

Add to `backend/.env`:

```env
# Cloudflare R2 Storage
R2_ACCOUNT_ID="your-account-id"  # From Cloudflare Dashboard URL
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_BUCKET_NAME="advancia-documents"
```

#### 4. Add Prisma Model

Add to `backend/prisma/schema.prisma`:

```prisma
model UploadedFile {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category    String   // receipts, invoices, documents, avatars, attachments
  filename    String
  key         String   // R2 storage key
  url         String   // Public or presigned URL
  size        Int      // File size in bytes
  contentType String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([category])
  @@index([createdAt])
}

// Add to User model:
model User {
  // ... existing fields
  uploadedFiles UploadedFile[]
}
```

#### 5. Install Dependencies

```bash
cd backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer
npm install -D @types/multer
```

#### 6. Run Migration

```bash
cd backend
npx prisma migrate dev --name add-uploaded-files
```

#### 7. Register Route

Add to `backend/src/index.ts`:

```typescript
import filesRouter from "./routes/files";

// Register routes
app.use("/api/files", filesRouter);
```

#### 8. Start Development Server

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend (FIXED - will now start)
cd frontend
pnpm dev
```

### Usage Example (Frontend):

```typescript
// Upload file
const formData = new FormData();
formData.append("file", file);
formData.append("category", "receipts");

const response = await fetch("/api/files/upload", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

const { file } = await response.json();
console.log("Uploaded:", file.url);
```

### Benefits:

✅ **Zero egress fees** - No data transfer charges
✅ **S3-compatible API** - Easy migration
✅ **Global distribution** - Fast access worldwide
✅ **10MB file size limit** - Configurable
✅ **Secure presigned URLs** - Temporary access
✅ **File categorization** - Organized storage

### File Categories:

- `receipts` - Transaction receipts
- `invoices` - Payment invoices
- `documents` - General documents
- `avatars` - User profile pictures
- `attachments` - Email/support attachments

### Next Steps:

1. Complete R2 setup in Cloudflare Dashboard
2. Add environment variables
3. Run Prisma migration
4. Test file uploads
5. Frontend will now start successfully!

The localhost startup issue is fixed - `output: "export"` now only applies to Cloudflare Pages builds, not development mode.
