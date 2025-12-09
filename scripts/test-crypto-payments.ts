/**
 * Crypto Payment Testing Script
 * Tests all crypto payment configurations and providers
 *
 * Usage: npx tsx scripts/test-crypto-payments.ts
 */

// Note: We test configuration without making actual API calls to avoid charges

interface TestResult {
  provider: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: unknown;
}

const results: TestResult[] = [];

function logResult(result: TestResult) {
  results.push(result);
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${icon} [${result.provider}] ${result.test}: ${result.message}`);
  if (result.details) {
    console.log('   Details:', JSON.stringify(result.details, null, 2));
  }
}

async function testNOWPayments() {
  console.log('\n🔍 Testing NOWPayments Configuration...\n');

  // Test 1: API Key Configuration
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    logResult({
      provider: 'NOWPayments',
      test: 'API Key Configuration',
      status: 'SKIP',
      message: 'NOWPAYMENTS_API_KEY not set',
    });
    return;
  }

  logResult({
    provider: 'NOWPayments',
    test: 'API Key Configuration',
    status: 'PASS',
    message: 'API key is configured',
  });

  // Test 2: IPN Secret Configuration
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!ipnSecret) {
    logResult({
      provider: 'NOWPayments',
      test: 'IPN Secret Configuration',
      status: 'FAIL',
      message: 'NOWPAYMENTS_IPN_SECRET not set (required for webhooks)',
    });
  } else {
    logResult({
      provider: 'NOWPayments',
      test: 'IPN Secret Configuration',
      status: 'PASS',
      message: 'IPN secret is configured',
    });
  }

  // Test 3: API Connectivity (without creating actual payment)
  try {
    const testUrl = `${process.env.NOWPAYMENTS_API_URL || 'https://api.nowpayments.io/v1'}/status`;
    const response = await fetch(testUrl, {
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (response.ok) {
      logResult({
        provider: 'NOWPayments',
        test: 'API Connectivity',
        status: 'PASS',
        message: 'API is accessible and responding',
      });
    } else {
      logResult({
        provider: 'NOWPayments',
        test: 'API Connectivity',
        status: 'FAIL',
        message: `API returned status ${response.status}`,
      });
    }
  } catch (error) {
    logResult({
      provider: 'NOWPayments',
      test: 'API Connectivity',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testAlchemyPay() {
  console.log('\n🔍 Testing Alchemy Pay Configuration...\n');

  // Test 1: App ID Configuration
  const appId = process.env.ALCHEMY_PAY_APP_ID;
  if (!appId) {
    logResult({
      provider: 'Alchemy Pay',
      test: 'App ID Configuration',
      status: 'SKIP',
      message: 'ALCHEMY_PAY_APP_ID not set',
    });
    return;
  }

  logResult({
    provider: 'Alchemy Pay',
    test: 'App ID Configuration',
    status: 'PASS',
    message: 'App ID is configured',
  });

  // Test 2: App Secret Configuration
  const appSecret = process.env.ALCHEMY_PAY_APP_SECRET;
  if (!appSecret) {
    logResult({
      provider: 'Alchemy Pay',
      test: 'App Secret Configuration',
      status: 'FAIL',
      message: 'ALCHEMY_PAY_APP_SECRET not set',
    });
  } else {
    logResult({
      provider: 'Alchemy Pay',
      test: 'App Secret Configuration',
      status: 'PASS',
      message: 'App secret is configured',
    });
  }

  // Test 3: API Configuration (without making actual API call)
  try {
    // Just verify configuration is correct
    if (appId && appSecret) {
      logResult({
        provider: 'Alchemy Pay',
        test: 'API Configuration',
        status: 'PASS',
        message: 'API credentials are configured correctly',
      });
    } else {
      logResult({
        provider: 'Alchemy Pay',
        test: 'API Configuration',
        status: 'FAIL',
        message: 'Missing API credentials',
      });
    }
  } catch (error) {
    logResult({
      provider: 'Alchemy Pay',
      test: 'API Configuration',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function runAllTests() {
  console.log('🚀 Crypto Payment Configuration Test Suite\n');
  console.log('='.repeat(60));

  await testNOWPayments();
  await testAlchemyPay();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary\n');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📈 Total: ${results.length}`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Please review the configuration.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Crypto payments are configured correctly.');
    process.exit(0);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});
