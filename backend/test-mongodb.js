#!/usr/bin/env node
/**
 * MongoDB Connection Test Script
 * 
 * Usage:
 * 1. Set MONGODB_URI in .env file
 * 2. Run: node test-mongodb.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'advancia_ledger';

async function testMongoDBConnection() {
  console.log('🔍 Testing MongoDB Connection...\n');

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.log('\n📝 Add to your .env file:');
    console.log('MONGODB_URI="mongodb+srv://username:password@cluster.xxxxx.mongodb.net/advancia_ledger?retryWrites=true&w=majority"');
    console.log('MONGODB_DB_NAME="advancia_ledger"');
    process.exit(1);
  }

  let client;
  try {
    console.log('📡 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    console.log('✅ Connected to MongoDB successfully!\n');

    const db = client.db(MONGODB_DB_NAME);
    
    // Test database operations
    console.log('📊 Database:', MONGODB_DB_NAME);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`📁 Collections: ${collections.length} found`);
    if (collections.length > 0) {
      collections.forEach(col => console.log(`   - ${col.name}`));
    }

    // Test write operation
    console.log('\n📝 Testing write operation...');
    const testCollection = db.collection('connection_test');
    const testDoc = {
      timestamp: new Date(),
      test: 'MongoDB connection successful',
      version: process.version,
    };
    await testCollection.insertOne(testDoc);
    console.log('✅ Write successful');

    // Test read operation
    console.log('📖 Testing read operation...');
    const result = await testCollection.findOne({ _id: testDoc._id });
    console.log('✅ Read successful');

    // Clean up test document
    await testCollection.deleteOne({ _id: testDoc._id });
    console.log('🧹 Cleanup complete\n');

    console.log('✨ All tests passed! MongoDB is ready to use.\n');
    console.log('📚 Next steps:');
    console.log('   1. Start your backend: npm run dev');
    console.log('   2. MongoDB will auto-connect on startup');
    console.log('   3. Use mongoTransactionLogger & mongoAILogger services');

  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check MONGODB_URI is correct');
    console.log('   2. Verify network access (IP whitelist in MongoDB Atlas)');
    console.log('   3. Confirm database user has correct permissions');
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n👋 Connection closed');
    }
  }
}

testMongoDBConnection();
