import axios from 'axios';

const BASE_URL = 'http://localhost:4000';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDcxY2YyYS1hZDNhLTQ3MDQtOTViMS0yOTdiNDRjNDNiODgiLCJlbWFpbCI6Im11Y2hhZWxqb2huNzM5MzM3QGdtYWlsLmNvbSIsInJvbGUiOiJBRE1JTiIsImdvb2dsZUlkIjoiMTAxODM0NzAzODc4NzYyNDg0MDU4IiwidHlwZSI6Imdvb2dsZSIsImlhdCI6MTc2NDczMzczNywiZXhwIjoxNzY1MzM4NTM3fQ.8-tdB1t9KM3KDA08Zcj26LNP0wvgDipVbNvFdbNRUOU';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, details: string) {
  results.push({ name, passed, details });
  const emoji = passed ? '✅' : '❌';
  console.log(${emoji} : );
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// TEST 1: SQL Injection Protection
// ============================================================================
async function testSQLInjection() {
  try {
    const response = await axios.post(${BASE_URL}/api/auth/login, {
      email: \"admin' OR '1'='1\",
      password: \"password' OR '1'='1\",
    });
    
    logTest(
      'SQL Injection Protection',
      response.status === 403,
      response.status === 403 ? 'Blocked SQL injection attempt' : 'FAILED: SQL injection not blocked'
    );
  } catch (error: any) {
    logTest(
      'SQL Injection Protection',
      error.response?.status === 403,
      error.response?.status === 403 ? 'Blocked SQL injection attempt' : Error: 
    );
  }
}

// ============================================================================
// TEST 2: XSS Protection
// ============================================================================
async function testXSS() {
  try {
    const response = await axios.post(${BASE_URL}/api/auth/register, {
      email: 'test@test.com',
      password: 'password',
      username: '<script>alert(\"XSS\")</script>',
    });
    
    logTest(
      'XSS Protection',
      response.status === 403,
      response.status === 403 ? 'Blocked XSS attempt' : 'FAILED: XSS not blocked'
    );
  } catch (error: any) {
    logTest(
      'XSS Protection',
      error.response?.status === 403,
      error.response?.status === 403 ? 'Blocked XSS attempt' : Error: 
    );
  }
}

// ============================================================================
// TEST 3: Rate Limiting (DDoS Protection)
// ============================================================================
async function testRateLimiting() {
  try {
    const requests = [];
    
    // Send 110 requests (exceeds 100/60sec limit)
    for (let i = 0; i < 110; i++) {
      requests.push(
        axios.get(${BASE_URL}/api/health).catch(err => err.response)
      );
    }
    
    const responses = await Promise.all(requests);
    const blocked = responses.filter(r => r?.status === 403 || r?.status === 429).length;
    
    logTest(
      'Rate Limiting (DDoS)',
      blocked > 0,
      blocked > 0 ? Blocked /110 excessive requests : 'FAILED: No rate limiting detected'
    );
  } catch (error: any) {
    logTest('Rate Limiting (DDoS)', false, Error: );
  }
}

// ============================================================================
// TEST 4: Brute Force Protection
// ============================================================================
async function testBruteForce() {
  try {
    const requests = [];
    
    // Send 10 failed login attempts (exceeds 5/15min limit)
    for (let i = 0; i < 10; i++) {
      requests.push(
        axios.post(${BASE_URL}/api/auth/login, {
          email: 'attacker@test.com',
          password: 'wrong-password',
        }).catch(err => err.response)
      );
    }
    
    const responses = await Promise.all(requests);
    const blocked = responses.filter(r => r?.status === 403 || r?.status === 429).length;
    
    logTest(
      'Brute Force Protection',
      blocked > 0,
      blocked > 0 ? Blocked /10 brute force attempts : 'FAILED: No brute force protection'
    );
  } catch (error: any) {
    logTest('Brute Force Protection', false, Error: );
  }
}

// ============================================================================
// TEST 5: Admin Dashboard Access
// ============================================================================
async function testAdminDashboard() {
  try {
    const response = await axios.get(${BASE_URL}/api/admin/security/dashboard, {
      headers: { Authorization: Bearer  },
    });
    
    const hasMetrics = response.data.data?.metrics && response.data.data?.globalThreatScore !== undefined;
    
    logTest(
      'Admin Dashboard Access',
      response.status === 200 && hasMetrics,
      response.status === 200 && hasMetrics ? 'Dashboard accessible with valid metrics' : 'FAILED: Dashboard error'
    );
  } catch (error: any) {
    logTest('Admin Dashboard Access', false, Error: );
  }
}

// ============================================================================
// TEST 6: Threat Database Logging
// ============================================================================
async function testThreatLogging() {
  try {
    // Generate a threat
    await axios.post(${BASE_URL}/api/auth/login, {
      email: \"admin' OR '1'='1\",
      password: 'password',
    }).catch(() => {});
    
    await delay(1000); // Wait for logging
    
    const response = await axios.get(${BASE_URL}/api/admin/security/threats, {
      headers: { Authorization: Bearer  },
    });
    
    const hasThreats = response.data.data?.threats?.length > 0;
    
    logTest(
      'Threat Database Logging',
      response.status === 200 && hasThreats,
      response.status === 200 && hasThreats ? Logged  threat IPs : 'FAILED: No threats logged'
    );
  } catch (error: any) {
    logTest('Threat Database Logging', false, Error: );
  }
}

// ============================================================================
// TEST 7: Manual Lockdown
// ============================================================================
async function testManualLockdown() {
  try {
    // Activate lockdown
    const lockdownResponse = await axios.post(
      ${BASE_URL}/api/admin/security/lockdown,
      {},
      { headers: { Authorization: Bearer  } }
    );
    
    await delay(1000);
    
    // Try to access as non-admin (should be blocked)
    const blockedResponse = await axios.get(${BASE_URL}/api/health).catch(err => err.response);
    
    // Deactivate lockdown
    await axios.post(
      ${BASE_URL}/api/admin/security/recovery,
      {},
      { headers: { Authorization: Bearer  } }
    );
    
    const lockdownWorked = lockdownResponse.status === 200 && blockedResponse?.status === 503;
    
    logTest(
      'Manual Lockdown',
      lockdownWorked,
      lockdownWorked ? 'Lockdown activated and blocked requests successfully' : 'FAILED: Lockdown not working'
    );
  } catch (error: any) {
    logTest('Manual Lockdown', false, Error: );
  }
}

// ============================================================================
// TEST 8: Legitimate User Access (Should NOT be blocked)
// ============================================================================
async function testLegitimateAccess() {
  try {
    const response = await axios.get(${BASE_URL}/api/health);
    
    logTest(
      'Legitimate User Access',
      response.status === 200,
      response.status === 200 ? 'Normal requests allowed through' : 'FAILED: Legitimate requests blocked'
    );
  } catch (error: any) {
    logTest('Legitimate User Access', false, Error: );
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================
async function runAllTests() {
  console.log('\n🛡️  SHIELD SECURITY SYSTEM - COMPREHENSIVE TEST SUITE\n');
  console.log('====================================================\n');
  
  await testLegitimateAccess();
  await delay(500);
  
  await testSQLInjection();
  await delay(500);
  
  await testXSS();
  await delay(500);
  
  await testAdminDashboard();
  await delay(500);
  
  await testThreatLogging();
  await delay(500);
  
  await testBruteForce();
  await delay(2000);
  
  await testRateLimiting();
  await delay(2000);
  
  await testManualLockdown();
  
  console.log('\n====================================================\n');
  console.log('📊 TEST SUMMARY\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(Total Tests: );
  console.log(Passed:  ✅);
  console.log(Failed:  ❌);
  console.log(Success Rate: %\n);
  
  if (failed > 0) {
    console.log('⚠️  Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(   - : );
    });
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

runAllTests();
