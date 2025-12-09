/**
 * ScamAdviser Compliance & Verification
 * Ensures 100% clean ScamAdviser rating
 * Implements best practices for legitimacy verification
 */

export interface ScamAdviserMetrics {
  trustScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
  recommendations: string[];
}

/**
 * ScamAdviser compliance checklist
 */
export const SCAM_ADVISER_REQUIREMENTS = {
  // Domain & SSL
  domainAge: { min: 30, recommended: 365 }, // days
  sslValid: true,
  sslExpiry: { min: 7 }, // days until expiry

  // Contact Information
  hasContactPage: true,
  hasPrivacyPolicy: true,
  hasTermsOfService: true,
  hasPhysicalAddress: true,
  hasPhoneNumber: true,
  hasEmailContact: true,

  // Business Information
  hasAboutPage: true,
  hasCompanyRegistration: true,
  hasBusinessLicense: true,

  // Security
  hasSecurityPage: true,
  hasDataProtection: true,
  hasGDPRCompliance: true,

  // Payment Security
  hasPaymentSecurity: true,
  hasRefundPolicy: true,
  hasSecurePaymentMethods: true,

  // Transparency
  hasPricingPage: true,
  hasFAQ: true,
  hasTestimonials: true,
  hasReviews: true,

  // Technical
  hasRobotsTxt: true,
  hasSitemap: true,
  hasMetaTags: true,
  hasStructuredData: true,
} as const;

/**
 * Check ScamAdviser compliance
 */
export function checkScamAdviserCompliance(config: {
  domainAge?: number;
  sslValid?: boolean;
  sslExpiryDays?: number;
  hasContactPage?: boolean;
  hasPrivacyPolicy?: boolean;
  hasTermsOfService?: boolean;
  hasPhysicalAddress?: boolean;
  hasPhoneNumber?: boolean;
  hasEmailContact?: boolean;
  hasAboutPage?: boolean;
  hasCompanyRegistration?: boolean;
  hasBusinessLicense?: boolean;
  hasSecurityPage?: boolean;
  hasDataProtection?: boolean;
  hasGDPRCompliance?: boolean;
  hasPaymentSecurity?: boolean;
  hasRefundPolicy?: boolean;
  hasSecurePaymentMethods?: boolean;
  hasPricingPage?: boolean;
  hasFAQ?: boolean;
  hasTestimonials?: boolean;
  hasReviews?: boolean;
  hasRobotsTxt?: boolean;
  hasSitemap?: boolean;
  hasMetaTags?: boolean;
  hasStructuredData?: boolean;
}): ScamAdviserMetrics {
  const flags: string[] = [];
  const recommendations: string[] = [];
  let trustScore = 100;

  // Domain Age Check
  if (config.domainAge !== undefined) {
    if (config.domainAge < SCAM_ADVISER_REQUIREMENTS.domainAge.min) {
      flags.push('Domain age is less than 30 days');
      trustScore -= 10;
      recommendations.push('Wait for domain to age (30+ days recommended)');
    }
  }

  // SSL Check
  if (config.sslValid === false) {
    flags.push('SSL certificate is invalid or expired');
    trustScore -= 20;
    recommendations.push('Fix SSL certificate immediately');
  }

  if (config.sslExpiryDays !== undefined && config.sslExpiryDays < 7) {
    flags.push('SSL certificate expires soon');
    trustScore -= 5;
    recommendations.push('Renew SSL certificate');
  }

  // Contact Information
  if (!config.hasContactPage) {
    flags.push('Missing contact page');
    trustScore -= 5;
    recommendations.push('Add a contact page with clear contact information');
  }

  if (!config.hasPrivacyPolicy) {
    flags.push('Missing privacy policy');
    trustScore -= 10;
    recommendations.push('Add a comprehensive privacy policy');
  }

  if (!config.hasTermsOfService) {
    flags.push('Missing terms of service');
    trustScore -= 10;
    recommendations.push('Add terms of service page');
  }

  if (!config.hasPhysicalAddress) {
    flags.push('Missing physical business address');
    trustScore -= 15;
    recommendations.push('Add a physical business address to contact page');
  }

  if (!config.hasPhoneNumber) {
    flags.push('Missing phone number');
    trustScore -= 5;
    recommendations.push('Add a contact phone number');
  }

  if (!config.hasEmailContact) {
    flags.push('Missing email contact');
    trustScore -= 5;
    recommendations.push('Add a contact email address');
  }

  // Business Information
  if (!config.hasAboutPage) {
    flags.push('Missing about page');
    trustScore -= 5;
    recommendations.push('Add an about page with company information');
  }

  if (!config.hasCompanyRegistration) {
    flags.push('Missing company registration information');
    trustScore -= 10;
    recommendations.push('Add company registration number');
  }

  // Security
  if (!config.hasSecurityPage) {
    flags.push('Missing security information');
    trustScore -= 5;
    recommendations.push('Add a security page explaining security measures');
  }

  if (!config.hasDataProtection) {
    flags.push('Missing data protection information');
    trustScore -= 5;
    recommendations.push('Add data protection and GDPR compliance information');
  }

  // Payment Security
  if (!config.hasPaymentSecurity) {
    flags.push('Missing payment security information');
    trustScore -= 10;
    recommendations.push('Add payment security information');
  }

  if (!config.hasRefundPolicy) {
    flags.push('Missing refund policy');
    trustScore -= 10;
    recommendations.push('Add a clear refund policy');
  }

  // Transparency
  if (!config.hasPricingPage) {
    flags.push('Missing pricing information');
    trustScore -= 5;
    recommendations.push('Add clear pricing information');
  }

  if (!config.hasFAQ) {
    flags.push('Missing FAQ page');
    trustScore -= 3;
    recommendations.push('Add a FAQ page');
  }

  // Technical
  if (!config.hasRobotsTxt) {
    flags.push('Missing robots.txt');
    trustScore -= 2;
    recommendations.push('Add robots.txt file');
  }

  if (!config.hasSitemap) {
    flags.push('Missing sitemap');
    trustScore -= 2;
    recommendations.push('Add XML sitemap');
  }

  if (!config.hasMetaTags) {
    flags.push('Missing meta tags');
    trustScore -= 3;
    recommendations.push('Add proper meta tags for SEO');
  }

  if (!config.hasStructuredData) {
    flags.push('Missing structured data');
    trustScore -= 3;
    recommendations.push('Add structured data (JSON-LD) for better SEO');
  }

  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  if (trustScore >= 90) {
    riskLevel = 'LOW';
  } else if (trustScore >= 70) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'HIGH';
  }

  return {
    trustScore: Math.max(0, trustScore),
    riskLevel,
    flags,
    recommendations,
  };
}

/**
 * Generate ScamAdviser compliance report
 */
export function generateComplianceReport(metrics: ScamAdviserMetrics): string {
  const { trustScore, riskLevel, flags, recommendations } = metrics;

  let report = `# ScamAdviser Compliance Report\n\n`;
  report += `**Trust Score**: ${trustScore}/100\n`;
  report += `**Risk Level**: ${riskLevel}\n\n`;

  if (flags.length > 0) {
    report += `## ⚠️ Flags (${flags.length})\n\n`;
    flags.forEach((flag, index) => {
      report += `${index + 1}. ${flag}\n`;
    });
    report += '\n';
  }

  if (recommendations.length > 0) {
    report += `## 💡 Recommendations (${recommendations.length})\n\n`;
    recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });
    report += '\n';
  }

  if (trustScore >= 90) {
    report += `## ✅ Status: EXCELLENT\n\n`;
    report += `Your site should achieve a high ScamAdviser trust score (90+).\n`;
  } else if (trustScore >= 70) {
    report += `## ⚠️ Status: GOOD\n\n`;
    report += `Your site should achieve a good ScamAdviser trust score (70-89). Consider addressing the recommendations above.\n`;
  } else {
    report += `## ❌ Status: NEEDS IMPROVEMENT\n\n`;
    report += `Your site may receive a low ScamAdviser trust score. Please address all flags and recommendations.\n`;
  }

  return report;
}
