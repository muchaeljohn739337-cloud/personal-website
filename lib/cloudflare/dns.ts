/**
 * Cloudflare DNS Management
 * Domain security, DNS records, and subdomain management
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

// =============================================================================
// API HELPER
// =============================================================================

async function cloudflareAPI(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: Record<string, unknown>
) {
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
    throw new Error('Cloudflare credentials not configured');
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}${endpoint}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || 'Cloudflare API error');
  }
  return data.result;
}

// =============================================================================
// DNS RECORD TYPES
// =============================================================================

export type DNSRecordType =
  | 'A'
  | 'AAAA'
  | 'CNAME'
  | 'TXT'
  | 'MX'
  | 'NS'
  | 'SRV'
  | 'CAA'
  | 'DNSKEY'
  | 'DS'
  | 'HTTPS'
  | 'LOC'
  | 'NAPTR'
  | 'PTR'
  | 'SMIMEA'
  | 'SSHFP'
  | 'SVCB'
  | 'TLSA'
  | 'URI';

export interface DNSRecord {
  id: string;
  type: DNSRecordType;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  priority?: number;
  createdOn: Date;
  modifiedOn: Date;
}

// =============================================================================
// DNS RECORD MANAGEMENT
// =============================================================================

/**
 * Get all DNS records
 */
export async function getDNSRecords(type?: DNSRecordType): Promise<DNSRecord[]> {
  try {
    const params = type ? `?type=${type}` : '';
    const records = await cloudflareAPI(`/dns_records${params}`);
    return records.map((r: Record<string, unknown>) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      content: r.content,
      ttl: r.ttl,
      proxied: r.proxied,
      priority: r.priority,
      createdOn: new Date(r.created_on as string),
      modifiedOn: new Date(r.modified_on as string),
    }));
  } catch (error) {
    console.error('Failed to get DNS records:', error);
    return [];
  }
}

/**
 * Create DNS record
 */
export async function createDNSRecord(record: {
  type: DNSRecordType;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  priority?: number;
}): Promise<DNSRecord | null> {
  try {
    const result = await cloudflareAPI('/dns_records', 'POST', {
      type: record.type,
      name: record.name,
      content: record.content,
      ttl: record.ttl || 1, // 1 = auto
      proxied: record.proxied ?? true,
      priority: record.priority,
    });

    return {
      id: result.id,
      type: result.type,
      name: result.name,
      content: result.content,
      ttl: result.ttl,
      proxied: result.proxied,
      priority: result.priority,
      createdOn: new Date(result.created_on),
      modifiedOn: new Date(result.modified_on),
    };
  } catch (error) {
    console.error('Failed to create DNS record:', error);
    return null;
  }
}

/**
 * Update DNS record
 */
export async function updateDNSRecord(
  recordId: string,
  updates: Partial<{
    type: DNSRecordType;
    name: string;
    content: string;
    ttl: number;
    proxied: boolean;
    priority: number;
  }>
): Promise<boolean> {
  try {
    await cloudflareAPI(`/dns_records/${recordId}`, 'PATCH', updates);
    return true;
  } catch (error) {
    console.error('Failed to update DNS record:', error);
    return false;
  }
}

/**
 * Delete DNS record
 */
export async function deleteDNSRecord(recordId: string): Promise<boolean> {
  try {
    await cloudflareAPI(`/dns_records/${recordId}`, 'DELETE');
    return true;
  } catch (error) {
    console.error('Failed to delete DNS record:', error);
    return false;
  }
}

// =============================================================================
// SUBDOMAIN MANAGEMENT
// =============================================================================

/**
 * Create subdomain with A record
 */
export async function createSubdomain(
  subdomain: string,
  ipAddress: string,
  proxied = true
): Promise<DNSRecord | null> {
  return createDNSRecord({
    type: 'A',
    name: subdomain,
    content: ipAddress,
    proxied,
  });
}

/**
 * Create subdomain with CNAME
 */
export async function createSubdomainCNAME(
  subdomain: string,
  target: string,
  proxied = true
): Promise<DNSRecord | null> {
  return createDNSRecord({
    type: 'CNAME',
    name: subdomain,
    content: target,
    proxied,
  });
}

/**
 * Get all subdomains
 */
export async function getSubdomains(): Promise<DNSRecord[]> {
  const records = await getDNSRecords();
  return records.filter(
    (r) => (r.type === 'A' || r.type === 'AAAA' || r.type === 'CNAME') && r.name !== '@'
  );
}

// =============================================================================
// EMAIL DNS RECORDS
// =============================================================================

/**
 * Setup email DNS records (MX, SPF, DKIM, DMARC)
 */
export async function setupEmailDNS(config: {
  mxRecords: Array<{ server: string; priority: number }>;
  spfRecord: string;
  dkimSelector?: string;
  dkimPublicKey?: string;
  dmarcPolicy?: 'none' | 'quarantine' | 'reject';
  dmarcEmail?: string;
}): Promise<{ success: boolean; created: string[]; failed: string[] }> {
  const created: string[] = [];
  const failed: string[] = [];

  // MX Records
  for (const mx of config.mxRecords) {
    try {
      await createDNSRecord({
        type: 'MX',
        name: '@',
        content: mx.server,
        priority: mx.priority,
        proxied: false,
      });
      created.push(`MX: ${mx.server}`);
    } catch {
      failed.push(`MX: ${mx.server}`);
    }
  }

  // SPF Record
  try {
    await createDNSRecord({
      type: 'TXT',
      name: '@',
      content: config.spfRecord,
      proxied: false,
    });
    created.push('SPF');
  } catch {
    failed.push('SPF');
  }

  // DKIM Record
  if (config.dkimSelector && config.dkimPublicKey) {
    try {
      await createDNSRecord({
        type: 'TXT',
        name: `${config.dkimSelector}._domainkey`,
        content: `v=DKIM1; k=rsa; p=${config.dkimPublicKey}`,
        proxied: false,
      });
      created.push('DKIM');
    } catch {
      failed.push('DKIM');
    }
  }

  // DMARC Record
  if (config.dmarcPolicy) {
    try {
      let dmarcValue = `v=DMARC1; p=${config.dmarcPolicy}`;
      if (config.dmarcEmail) {
        dmarcValue += `; rua=mailto:${config.dmarcEmail}; ruf=mailto:${config.dmarcEmail}`;
      }
      await createDNSRecord({
        type: 'TXT',
        name: '_dmarc',
        content: dmarcValue,
        proxied: false,
      });
      created.push('DMARC');
    } catch {
      failed.push('DMARC');
    }
  }

  return { success: failed.length === 0, created, failed };
}

/**
 * Verify email DNS configuration
 */
export async function verifyEmailDNS(): Promise<{
  hasMX: boolean;
  hasSPF: boolean;
  hasDKIM: boolean;
  hasDMARC: boolean;
  issues: string[];
}> {
  const records = await getDNSRecords();
  const issues: string[] = [];

  const mxRecords = records.filter((r) => r.type === 'MX');
  const txtRecords = records.filter((r) => r.type === 'TXT');

  const hasMX = mxRecords.length > 0;
  const hasSPF = txtRecords.some((r) => r.content.startsWith('v=spf1'));
  const hasDKIM = txtRecords.some((r) => r.name.includes('._domainkey'));
  const hasDMARC = txtRecords.some((r) => r.name.startsWith('_dmarc'));

  if (!hasMX) issues.push('No MX records found - email delivery will fail');
  if (!hasSPF) issues.push('No SPF record found - emails may be marked as spam');
  if (!hasDKIM) issues.push('No DKIM record found - email authentication incomplete');
  if (!hasDMARC) issues.push('No DMARC record found - domain spoofing protection missing');

  return { hasMX, hasSPF, hasDKIM, hasDMARC, issues };
}

// =============================================================================
// SECURITY DNS RECORDS
// =============================================================================

/**
 * Setup CAA records for certificate authority authorization
 */
export async function setupCAARecords(
  allowedCAs: string[] = ['letsencrypt.org', 'digicert.com', 'sectigo.com']
): Promise<boolean> {
  try {
    for (const ca of allowedCAs) {
      await createDNSRecord({
        type: 'CAA',
        name: '@',
        content: `0 issue "${ca}"`,
        proxied: false,
      });
    }

    // Add iodef for reporting
    await createDNSRecord({
      type: 'CAA',
      name: '@',
      content: '0 iodef "mailto:security@advanciapayledger.com"',
      proxied: false,
    });

    return true;
  } catch (error) {
    console.error('Failed to setup CAA records:', error);
    return false;
  }
}

/**
 * Setup DNSSEC
 */
export async function getDNSSECStatus(): Promise<{
  enabled: boolean;
  status: string;
  dsRecord?: string;
}> {
  try {
    const result = await cloudflareAPI('/dnssec');
    return {
      enabled: result.status === 'active',
      status: result.status,
      dsRecord: result.ds,
    };
  } catch (error) {
    console.error('Failed to get DNSSEC status:', error);
    return { enabled: false, status: 'unknown' };
  }
}

/**
 * Enable DNSSEC
 */
export async function enableDNSSEC(): Promise<{ success: boolean; dsRecord?: string }> {
  try {
    const result = await cloudflareAPI('/dnssec', 'PATCH', { status: 'active' });
    return { success: true, dsRecord: result.ds };
  } catch (error) {
    console.error('Failed to enable DNSSEC:', error);
    return { success: false };
  }
}

// =============================================================================
// DOMAIN HEALTH CHECK
// =============================================================================

export interface DomainHealthCheck {
  dns: {
    healthy: boolean;
    recordCount: number;
    issues: string[];
  };
  email: {
    configured: boolean;
    hasMX: boolean;
    hasSPF: boolean;
    hasDKIM: boolean;
    hasDMARC: boolean;
  };
  security: {
    dnssecEnabled: boolean;
    hasCAARecords: boolean;
    sslMode: string;
  };
  performance: {
    proxiedRecords: number;
    totalRecords: number;
  };
}

/**
 * Comprehensive domain health check
 */
export async function checkDomainHealth(): Promise<DomainHealthCheck> {
  const [records, emailStatus, dnssec, sslSettings] = await Promise.all([
    getDNSRecords(),
    verifyEmailDNS(),
    getDNSSECStatus(),
    cloudflareAPI('/settings/ssl').catch(() => ({ value: 'unknown' })),
  ]);

  const issues: string[] = [];
  const proxiedRecords = records.filter((r) => r.proxied).length;
  const caaRecords = records.filter((r) => r.type === 'CAA');

  // Check for common issues
  if (records.length === 0) {
    issues.push('No DNS records found');
  }

  if (proxiedRecords === 0) {
    issues.push('No records are proxied through Cloudflare');
  }

  return {
    dns: {
      healthy: issues.length === 0,
      recordCount: records.length,
      issues: [...issues, ...emailStatus.issues],
    },
    email: {
      configured: emailStatus.hasMX,
      hasMX: emailStatus.hasMX,
      hasSPF: emailStatus.hasSPF,
      hasDKIM: emailStatus.hasDKIM,
      hasDMARC: emailStatus.hasDMARC,
    },
    security: {
      dnssecEnabled: dnssec.enabled,
      hasCAARecords: caaRecords.length > 0,
      sslMode: sslSettings.value,
    },
    performance: {
      proxiedRecords,
      totalRecords: records.length,
    },
  };
}

// =============================================================================
// BULK DNS OPERATIONS
// =============================================================================

/**
 * Import DNS records from zone file format
 */
export async function importDNSRecords(
  zoneFileContent: string
): Promise<{ imported: number; failed: number; errors: string[] }> {
  const lines = zoneFileContent.split('\n').filter((l) => l.trim() && !l.startsWith(';'));
  let imported = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length < 4) continue;

    const [name, ttl, , type, ...contentParts] = parts;
    const content = contentParts.join(' ');

    try {
      await createDNSRecord({
        type: type as DNSRecordType,
        name: name === '@' ? '@' : name,
        content,
        ttl: parseInt(ttl) || 1,
        proxied: false,
      });
      imported++;
    } catch (error) {
      failed++;
      errors.push(`Failed to import ${type} record for ${name}: ${error}`);
    }
  }

  return { imported, failed, errors };
}

/**
 * Export DNS records to zone file format
 */
export async function exportDNSRecords(): Promise<string> {
  const records = await getDNSRecords();
  const lines: string[] = ['; DNS Zone Export', `; Generated: ${new Date().toISOString()}`, ''];

  for (const record of records) {
    const priority = record.priority ? `${record.priority} ` : '';
    lines.push(`${record.name}\t${record.ttl}\tIN\t${record.type}\t${priority}${record.content}`);
  }

  return lines.join('\n');
}
