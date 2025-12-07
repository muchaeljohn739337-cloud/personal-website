/**
 * Email Security System
 * Anti-phishing, tracking prevention, leak detection, and email validation
 */

import crypto from 'crypto';

// =============================================================================
// EMAIL SECURITY CONFIGURATION
// =============================================================================

const BLOCKED_DOMAINS = [
  // Known phishing domains (add more as needed)
  'tempmail.com',
  'throwaway.email',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
  'fakeinbox.com',
  'trashmail.com',
  'yopmail.com',
  'getnada.com',
  'temp-mail.org',
];

const SUSPICIOUS_PATTERNS = [
  /paypal.*security/i,
  /bank.*verify/i,
  /account.*suspend/i,
  /urgent.*action/i,
  /click.*here.*now/i,
  /verify.*immediately/i,
  /password.*expire/i,
  /unusual.*activity/i,
  /confirm.*identity/i,
  /limited.*time/i,
];

const TRACKING_PIXEL_PATTERNS = [
  /\.gif\?.*$/i,
  /\.png\?.*$/i,
  /track\./i,
  /pixel\./i,
  /beacon\./i,
  /open\./i,
  /click\./i,
  /analytics\./i,
];

// =============================================================================
// EMAIL VALIDATION
// =============================================================================

export interface EmailValidationResult {
  isValid: boolean;
  isDisposable: boolean;
  isSuspicious: boolean;
  riskScore: number; // 0-100
  reasons: string[];
  suggestions: string[];
}

/**
 * Comprehensive email validation
 */
export function validateEmail(email: string): EmailValidationResult {
  const reasons: string[] = [];
  const suggestions: string[] = [];
  let riskScore = 0;

  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      isDisposable: false,
      isSuspicious: true,
      riskScore: 100,
      reasons: ['Invalid email format'],
      suggestions: ['Please enter a valid email address'],
    };
  }

  const [localPart, domain] = email.toLowerCase().split('@');

  // Check for disposable email
  const isDisposable = BLOCKED_DOMAINS.some(
    (blocked) => domain === blocked || domain.endsWith(`.${blocked}`)
  );
  if (isDisposable) {
    riskScore += 50;
    reasons.push('Disposable email address detected');
    suggestions.push('Please use a permanent email address');
  }

  // Check local part for suspicious patterns
  if (/^[0-9]+$/.test(localPart)) {
    riskScore += 10;
    reasons.push('Email contains only numbers');
  }

  if (localPart.length < 3) {
    riskScore += 10;
    reasons.push('Email local part is very short');
  }

  if (/[+]/.test(localPart)) {
    riskScore += 5;
    reasons.push('Email contains alias indicator (+)');
  }

  // Check domain
  if (domain.split('.').length > 4) {
    riskScore += 15;
    reasons.push('Unusual domain structure');
  }

  // Check for common typos in popular domains
  const typoChecks: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gnail.com': 'gmail.com',
    'hotmal.com': 'hotmail.com',
    'hotmial.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outloo.com': 'outlook.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
  };

  if (typoChecks[domain]) {
    riskScore += 20;
    reasons.push(`Possible typo in domain`);
    suggestions.push(`Did you mean ${localPart}@${typoChecks[domain]}?`);
  }

  return {
    isValid: riskScore < 50,
    isDisposable,
    isSuspicious: riskScore >= 30,
    riskScore: Math.min(riskScore, 100),
    reasons,
    suggestions,
  };
}

// =============================================================================
// PHISHING DETECTION
// =============================================================================

export interface PhishingAnalysis {
  isPhishing: boolean;
  confidence: number; // 0-100
  indicators: string[];
  safeLinks: string[];
  suspiciousLinks: string[];
}

/**
 * Analyze email content for phishing indicators
 */
export function analyzeForPhishing(
  subject: string,
  body: string,
  senderEmail: string,
  links: string[] = []
): PhishingAnalysis {
  const indicators: string[] = [];
  let confidence = 0;
  const suspiciousLinks: string[] = [];
  const safeLinks: string[] = [];

  // Check subject for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(subject)) {
      confidence += 15;
      indicators.push(`Suspicious subject pattern: ${pattern.source}`);
    }
  }

  // Check body for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(body)) {
      confidence += 10;
      indicators.push(`Suspicious content pattern detected`);
    }
  }

  // Check for urgency language
  const urgencyWords = ['urgent', 'immediately', 'now', 'asap', 'expire', 'suspended', 'locked'];
  const urgencyCount = urgencyWords.filter(
    (word) => body.toLowerCase().includes(word) || subject.toLowerCase().includes(word)
  ).length;
  if (urgencyCount >= 2) {
    confidence += 20;
    indicators.push('Multiple urgency indicators');
  }

  // Analyze links
  for (const link of links) {
    try {
      const url = new URL(link);

      // Check for IP address URLs
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(url.hostname)) {
        confidence += 25;
        indicators.push('Link uses IP address instead of domain');
        suspiciousLinks.push(link);
        continue;
      }

      // Check for suspicious TLDs
      const suspiciousTLDs = ['.xyz', '.top', '.click', '.link', '.work', '.date'];
      if (suspiciousTLDs.some((tld) => url.hostname.endsWith(tld))) {
        confidence += 15;
        indicators.push('Link uses suspicious TLD');
        suspiciousLinks.push(link);
        continue;
      }

      // Check for URL shorteners
      const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd'];
      if (shorteners.includes(url.hostname)) {
        confidence += 10;
        indicators.push('Link uses URL shortener');
        suspiciousLinks.push(link);
        continue;
      }

      // Check for lookalike domains
      const legitimateDomains = [
        'paypal.com',
        'google.com',
        'microsoft.com',
        'apple.com',
        'amazon.com',
      ];
      for (const legit of legitimateDomains) {
        const similarity = calculateStringSimilarity(url.hostname, legit);
        if (similarity > 0.7 && similarity < 1) {
          confidence += 30;
          indicators.push(`Possible domain spoofing: ${url.hostname} looks like ${legit}`);
          suspiciousLinks.push(link);
          break;
        }
      }

      if (!suspiciousLinks.includes(link)) {
        safeLinks.push(link);
      }
    } catch {
      // Invalid URL
      suspiciousLinks.push(link);
    }
  }

  // Check sender email
  const senderValidation = validateEmail(senderEmail);
  if (senderValidation.isDisposable) {
    confidence += 20;
    indicators.push('Sender uses disposable email');
  }

  // Check for mismatched sender
  const senderDomain = senderEmail.split('@')[1];
  const claimedBrands = ['paypal', 'amazon', 'microsoft', 'apple', 'google', 'bank'];
  for (const brand of claimedBrands) {
    if (
      (body.toLowerCase().includes(brand) || subject.toLowerCase().includes(brand)) &&
      !senderDomain?.includes(brand)
    ) {
      confidence += 25;
      indicators.push(`Email mentions ${brand} but sender domain doesn't match`);
    }
  }

  return {
    isPhishing: confidence >= 50,
    confidence: Math.min(confidence, 100),
    indicators,
    safeLinks,
    suspiciousLinks,
  };
}

/**
 * Calculate string similarity (Levenshtein distance based)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const costs: number[] = [];
  for (let i = 0; i <= shorter.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= longer.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (shorter.charAt(i - 1) !== longer.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[longer.length] = lastValue;
  }

  return (longer.length - costs[longer.length]) / longer.length;
}

// =============================================================================
// TRACKING PREVENTION
// =============================================================================

export interface TrackingAnalysis {
  hasTrackers: boolean;
  trackerCount: number;
  trackers: TrackerInfo[];
  cleanedContent: string;
}

export interface TrackerInfo {
  type: 'pixel' | 'link' | 'beacon';
  url: string;
  source?: string;
}

/**
 * Detect and remove email trackers
 */
export function removeEmailTrackers(htmlContent: string): TrackingAnalysis {
  const trackers: TrackerInfo[] = [];
  let cleanedContent = htmlContent;

  // Detect tracking pixels (1x1 images)
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(htmlContent)) !== null) {
    const imgTag = match[0];
    const src = match[1];

    // Check for tracking indicators
    const isTracker =
      TRACKING_PIXEL_PATTERNS.some((pattern) => pattern.test(src)) ||
      imgTag.includes('width="1"') ||
      imgTag.includes('height="1"') ||
      imgTag.includes('width=1') ||
      imgTag.includes('height=1') ||
      /style=["'][^"']*display:\s*none/i.test(imgTag);

    if (isTracker) {
      trackers.push({
        type: 'pixel',
        url: src,
        source: extractTrackerSource(src),
      });
      cleanedContent = cleanedContent.replace(imgTag, '');
    }
  }

  // Detect tracking links
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>/gi;
  while ((match = linkRegex.exec(htmlContent)) !== null) {
    const href = match[1];

    if (TRACKING_PIXEL_PATTERNS.some((pattern) => pattern.test(href))) {
      trackers.push({
        type: 'link',
        url: href,
        source: extractTrackerSource(href),
      });
    }
  }

  // Remove tracking beacons
  const beaconRegex = /<script[^>]*>[\s\S]*?(track|beacon|analytics)[\s\S]*?<\/script>/gi;
  cleanedContent = cleanedContent.replace(beaconRegex, (match) => {
    trackers.push({
      type: 'beacon',
      url: 'inline-script',
    });
    return '';
  });

  return {
    hasTrackers: trackers.length > 0,
    trackerCount: trackers.length,
    trackers,
    cleanedContent,
  };
}

/**
 * Extract tracker source from URL
 */
function extractTrackerSource(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return 'unknown';
  }
}

// =============================================================================
// EMAIL LEAK DETECTION
// =============================================================================

export interface LeakCheckResult {
  isLeaked: boolean;
  breachCount: number;
  breaches: BreachInfo[];
  lastChecked: Date;
}

export interface BreachInfo {
  name: string;
  date: string;
  dataTypes: string[];
}

/**
 * Check if email has been in known data breaches
 * Uses Have I Been Pwned API (requires API key for production)
 */
export async function checkEmailLeaks(email: string): Promise<LeakCheckResult> {
  const HIBP_API_KEY = process.env.HIBP_API_KEY;

  if (!HIBP_API_KEY) {
    console.warn('HIBP API key not configured');
    return {
      isLeaked: false,
      breachCount: 0,
      breaches: [],
      lastChecked: new Date(),
    };
  }

  try {
    // Hash email for privacy
    const emailHash = crypto.createHash('sha1').update(email.toLowerCase()).digest('hex');

    const response = await fetch(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`,
      {
        headers: {
          'hibp-api-key': HIBP_API_KEY,
          'User-Agent': 'Advancia-Security-Check',
        },
      }
    );

    if (response.status === 404) {
      return {
        isLeaked: false,
        breachCount: 0,
        breaches: [],
        lastChecked: new Date(),
      };
    }

    if (!response.ok) {
      throw new Error(`HIBP API error: ${response.status}`);
    }

    const breaches = await response.json();

    return {
      isLeaked: breaches.length > 0,
      breachCount: breaches.length,
      breaches: breaches.map((b: Record<string, unknown>) => ({
        name: b.Name,
        date: b.BreachDate,
        dataTypes: b.DataClasses,
      })),
      lastChecked: new Date(),
    };
  } catch (error) {
    console.error('Email leak check failed:', error);
    return {
      isLeaked: false,
      breachCount: 0,
      breaches: [],
      lastChecked: new Date(),
    };
  }
}

// =============================================================================
// DKIM/SPF/DMARC VALIDATION
// =============================================================================

export interface EmailAuthResult {
  spf: 'pass' | 'fail' | 'softfail' | 'neutral' | 'none';
  dkim: 'pass' | 'fail' | 'none';
  dmarc: 'pass' | 'fail' | 'none';
  isAuthenticated: boolean;
}

/**
 * Generate DKIM record for domain
 */
export function generateDKIMRecord(selector: string, publicKey: string): string {
  return `v=DKIM1; k=rsa; p=${publicKey}`;
}

/**
 * Generate SPF record for domain
 */
export function generateSPFRecord(options: {
  includes?: string[];
  ips?: string[];
  mx?: boolean;
  all?: 'fail' | 'softfail' | 'neutral';
}): string {
  const parts = ['v=spf1'];

  if (options.mx) {
    parts.push('mx');
  }

  if (options.includes) {
    for (const include of options.includes) {
      parts.push(`include:${include}`);
    }
  }

  if (options.ips) {
    for (const ip of options.ips) {
      parts.push(ip.includes(':') ? `ip6:${ip}` : `ip4:${ip}`);
    }
  }

  const allPolicy = options.all || 'softfail';
  const allMap = { fail: '-all', softfail: '~all', neutral: '?all' };
  parts.push(allMap[allPolicy]);

  return parts.join(' ');
}

/**
 * Generate DMARC record for domain
 */
export function generateDMARCRecord(options: {
  policy: 'none' | 'quarantine' | 'reject';
  rua?: string; // Aggregate report email
  ruf?: string; // Forensic report email
  pct?: number; // Percentage of messages to apply policy
  aspf?: 'r' | 's'; // SPF alignment mode
  adkim?: 'r' | 's'; // DKIM alignment mode
}): string {
  const parts = [`v=DMARC1`, `p=${options.policy}`];

  if (options.rua) parts.push(`rua=mailto:${options.rua}`);
  if (options.ruf) parts.push(`ruf=mailto:${options.ruf}`);
  if (options.pct !== undefined) parts.push(`pct=${options.pct}`);
  if (options.aspf) parts.push(`aspf=${options.aspf}`);
  if (options.adkim) parts.push(`adkim=${options.adkim}`);

  return parts.join('; ');
}

// =============================================================================
// EMAIL SECURITY HEADERS
// =============================================================================

/**
 * Generate secure email headers
 */
export function generateSecureEmailHeaders(options: {
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
}): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Mailer': 'Advancia-Secure-Mailer/1.0',
    'X-Priority': '3',
    'X-MSMail-Priority': 'Normal',
    'X-Auto-Response-Suppress': 'OOF, AutoReply',
    Precedence: 'bulk',
  };

  if (options.messageId) {
    headers['Message-ID'] = options.messageId;
  }

  if (options.inReplyTo) {
    headers['In-Reply-To'] = options.inReplyTo;
  }

  if (options.references?.length) {
    headers['References'] = options.references.join(' ');
  }

  return headers;
}
