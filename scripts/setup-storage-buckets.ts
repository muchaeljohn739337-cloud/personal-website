/**
 * Setup Storage Buckets Script
 * Creates required storage buckets in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface BucketConfig {
  name: string;
  public: boolean;
  description: string;
}

const buckets: BucketConfig[] = [
  {
    name: 'user-avatars',
    public: true,
    description: 'User profile images',
  },
  {
    name: 'blog-images',
    public: true,
    description: 'Blog post images',
  },
  {
    name: 'workspace-assets',
    public: false,
    description: 'Workspace files and assets',
  },
  {
    name: 'ai-outputs',
    public: false,
    description: 'AI-generated content',
  },
  {
    name: 'documents',
    public: false,
    description: 'User documents',
  },
];

async function setupBuckets() {
  console.log('📦 Setting up Storage Buckets...\n');
  console.log('📋 Project:', supabaseUrl);
  console.log('');

  for (const bucket of buckets) {
    try {
      // Check if bucket exists
      const { data: existing, error: checkError } = await supabase.storage.getBucket(bucket.name);

      if (existing) {
        console.log(`✅ Bucket "${bucket.name}" already exists`);
        continue;
      }

      if (checkError && checkError.message.includes('not found')) {
        // Create bucket
        const { data, error } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public,
          fileSizeLimit: 52428800, // 50MB
        });

        if (error) {
          console.error(`❌ Failed to create bucket "${bucket.name}":`, error.message);
        } else {
          console.log(
            `✅ Created bucket "${bucket.name}" (${bucket.public ? 'public' : 'private'})`
          );
        }
      } else {
        console.error(`❌ Error checking bucket "${bucket.name}":`, checkError?.message);
      }
    } catch (error) {
      console.error(`❌ Exception creating bucket "${bucket.name}":`, error);
    }
  }

  console.log('\n💡 Manual Setup (if script fails):');
  console.log(
    '   1. Go to: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/storage/files'
  );
  buckets.forEach((bucket) => {
    console.log(`   2. Create bucket: ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
  });
  console.log('');
}

setupBuckets().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
