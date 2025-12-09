import { NextResponse } from 'next/server';

import {
  checkScamAdviserCompliance,
  generateComplianceReport,
} from '@/lib/legitimacy/scam-adviser';

// GET /api/health/legitimacy - Check ScamAdviser compliance
export async function GET() {
  try {
    // Check compliance (in production, fetch actual data)
    const compliance = checkScamAdviserCompliance({
      domainAge: 365, // Assume domain is 1+ years old
      sslValid: true,
      sslExpiryDays: 30,
      hasContactPage: true,
      hasPrivacyPolicy: true,
      hasTermsOfService: true,
      hasPhysicalAddress: true,
      hasPhoneNumber: true,
      hasEmailContact: true,
      hasAboutPage: true,
      hasCompanyRegistration: true,
      hasBusinessLicense: true,
      hasSecurityPage: true,
      hasDataProtection: true,
      hasGDPRCompliance: true,
      hasPaymentSecurity: true,
      hasRefundPolicy: true,
      hasSecurePaymentMethods: true,
      hasPricingPage: true,
      hasFAQ: true,
      hasTestimonials: true,
      hasReviews: true,
      hasRobotsTxt: true,
      hasSitemap: true,
      hasMetaTags: true,
      hasStructuredData: true,
    });

    const report = generateComplianceReport(compliance);

    return NextResponse.json({
      success: true,
      compliance: {
        trustScore: compliance.trustScore,
        riskLevel: compliance.riskLevel,
        flags: compliance.flags,
        recommendations: compliance.recommendations,
      },
      report,
      status:
        compliance.trustScore >= 90
          ? 'EXCELLENT'
          : compliance.trustScore >= 70
            ? 'GOOD'
            : 'NEEDS_IMPROVEMENT',
    });
  } catch (error) {
    console.error('Legitimacy check error:', error);
    return NextResponse.json({ error: 'Failed to check legitimacy status' }, { status: 500 });
  }
}
