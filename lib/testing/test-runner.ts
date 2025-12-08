/**
 * Automated Test Runner with Feedback Reporting
 * Runs tests and sends results to admin dashboard
 */

export interface TestResult {
  id: string;
  name: string;
  suite: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  timestamp: Date;
}

export interface TestReport {
  id: string;
  runAt: Date;
  duration: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage?: number;
  results: TestResult[];
  summary: string;
}

// Store test reports in memory (in production, use database)
const testReports: TestReport[] = [];

export function generateTestReport(results: TestResult[]): TestReport {
  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  const report: TestReport = {
    id: `report-${Date.now()}`,
    runAt: new Date(),
    duration: totalDuration,
    total: results.length,
    passed,
    failed,
    skipped,
    results,
    summary: generateSummary(passed, failed, skipped),
  };

  testReports.push(report);
  return report;
}

function generateSummary(passed: number, failed: number, skipped: number): string {
  const total = passed + failed + skipped;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';

  if (failed === 0) {
    return `✅ All ${passed} tests passed (${passRate}% pass rate)`;
  } else {
    return `⚠️ ${failed} of ${total} tests failed (${passRate}% pass rate)`;
  }
}

export function getLatestReport(): TestReport | null {
  return testReports[testReports.length - 1] || null;
}

export function getAllReports(limit = 10): TestReport[] {
  return testReports.slice(-limit);
}

// =============================================================================
// HEALTH CHECK TESTS
// =============================================================================

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  message?: string;
}

export async function runHealthChecks(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];

  // Database check
  const dbStart = Date.now();
  try {
    // In real implementation: await prisma.$queryRaw`SELECT 1`
    results.push({
      service: 'Database',
      status: 'healthy',
      responseTime: Date.now() - dbStart,
    });
  } catch (error) {
    results.push({
      service: 'Database',
      status: 'down',
      responseTime: Date.now() - dbStart,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // API check
  const apiStart = Date.now();
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/health`);
    results.push({
      service: 'API',
      status: response.ok ? 'healthy' : 'degraded',
      responseTime: Date.now() - apiStart,
    });
  } catch {
    results.push({
      service: 'API',
      status: 'down',
      responseTime: Date.now() - apiStart,
    });
  }

  // External services
  const services = [
    { name: 'Stripe', url: 'https://api.stripe.com/v1' },
    { name: 'Resend', url: 'https://api.resend.com' },
  ];

  for (const service of services) {
    const start = Date.now();
    try {
      const response = await fetch(service.url, { method: 'HEAD' });
      results.push({
        service: service.name,
        status: response.status < 500 ? 'healthy' : 'degraded',
        responseTime: Date.now() - start,
      });
    } catch {
      results.push({
        service: service.name,
        status: 'down',
        responseTime: Date.now() - start,
      });
    }
  }

  return results;
}

// =============================================================================
// FEEDBACK NOTIFICATION
// =============================================================================

export async function sendTestFeedback(report: TestReport): Promise<void> {
  // Log to console
  console.log('\n========================================');
  console.log('🧪 TEST REPORT');
  console.log('========================================');
  console.log(`Run at: ${report.runAt.toISOString()}`);
  console.log(`Duration: ${report.duration}ms`);
  console.log(`Results: ${report.passed} passed, ${report.failed} failed, ${report.skipped} skipped`);
  console.log(`Summary: ${report.summary}`);

  if (report.failed > 0) {
    console.log('\n❌ Failed Tests:');
    report.results
      .filter((r) => r.status === 'failed')
      .forEach((r) => {
        console.log(`  - ${r.suite} > ${r.name}`);
        if (r.error) console.log(`    Error: ${r.error}`);
      });
  }

  console.log('========================================\n');

  // In production, send to:
  // - Slack webhook
  // - Email to admins
  // - Store in database
  // - Push to monitoring dashboard
}

// =============================================================================
// AUTO-RUN CONFIGURATION
// =============================================================================

export const TEST_SCHEDULE = {
  unit: '0 */6 * * *', // Every 6 hours
  integration: '0 0 * * *', // Daily at midnight
  e2e: '0 3 * * 0', // Weekly on Sunday at 3 AM
  health: '*/5 * * * *', // Every 5 minutes
};

export function shouldRunTests(type: keyof typeof TEST_SCHEDULE): boolean {
  // Simple check - in production use proper cron parser
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const day = now.getDay();

  switch (type) {
    case 'unit':
      return minute === 0 && hour % 6 === 0;
    case 'integration':
      return minute === 0 && hour === 0;
    case 'e2e':
      return minute === 0 && hour === 3 && day === 0;
    case 'health':
      return minute % 5 === 0;
    default:
      return false;
  }
}
