/**
 * Supabase Storage Verification Script
 * Checks storage buckets, files, and permissions
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStorage() {
  console.log('🗄️  Checking Supabase Storage...\n');

  try {
    // List all buckets
    console.log('📦 Checking Storage Buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Error fetching buckets:', bucketsError.message);
      return;
    }

    if (!buckets || buckets.length === 0) {
      console.log('⚠️  No storage buckets found');
      console.log('\n💡 Create buckets in Supabase Dashboard:');
      console.log('   - Storage → Create Bucket');
      console.log('   - Recommended buckets:');
      console.log('     * user-avatars (public)');
      console.log('     * blog-images (public)');
      console.log('     * documents (private)');
      console.log('     * workspace-assets (private)');
      return;
    }

    console.log(`✅ Found ${buckets.length} bucket(s):\n`);

    for (const bucket of buckets) {
      console.log(`📦 ${bucket.name}`);
      console.log(`   ID: ${bucket.id}`);
      console.log(`   Public: ${bucket.public ? 'Yes' : 'No'}`);
      console.log(`   Created: ${bucket.created_at}`);

      // List files in bucket
      const { data: files, error: filesError } = await supabase.storage.from(bucket.name).list('', {
        limit: 10,
      });

      if (!filesError && files && files.length > 0) {
        console.log(`   Files: ${files.length} (showing first 10)`);
        files.slice(0, 5).forEach((file) => {
          console.log(`     - ${file.name} (${(file.metadata?.size || 0) / 1024} KB)`);
        });
      } else {
        console.log(`   Files: 0`);
      }
      console.log('');
    }

    console.log('✅ Storage check complete!');
  } catch (error) {
    console.error('❌ Error checking storage:', error);
    process.exit(1);
  }
}

checkStorage();
