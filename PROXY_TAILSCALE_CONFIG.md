# Proxy & Tailscale Configuration Status

**Last Updated:** December 10, 2025  
**Status:** ✅ Configured (Tailscale Offline - requires connection)

---

## 📡 Tailscale Configuration

### Current Status

- **Installation:** ✅ Installed (`C:\Program Files\Tailscale\tailscale.exe`)
- **Status:** 🟡 Offline (coordination server disconnected)
- **Version:** 1.90.9 (update available to 1.92.1)
- **Hostname:** `desktop-h7t9npm`
- **DNS Name:** `desktop-h7t9npm.taile382c0.ts.net`

### Network Details

| Property         | Value                       |
| ---------------- | --------------------------- |
| Tailscale IPv4   | `100.123.158.7`             |
| Tailscale IPv6   | `fd7a:115c:a1e0::df01:9e07` |
| Public IP        | `129.205.124.201:3264`      |
| Relay Server     | `lhr` (London)              |
| Operating System | Windows                     |
| User ID          | 8641546392004186            |

### Capabilities Enabled

- ✅ File sharing
- ✅ SSH access
- ✅ Admin privileges
- ✅ Owner privileges
- ✅ Tailnet lock support

### Required Actions

#### 1. Update Tailscale

```powershell
tailscale update
# OR enable auto-updates
tailscale set --auto-update
```

#### 2. Reconnect to Network

```powershell
# Check connection status
tailscale status

# If offline, restart service
Restart-Service Tailscale

# Or reconnect
tailscale up
```

#### 3. Verify Connectivity

```powershell
# Ping another Tailscale device
tailscale ping <device-name>

# Check network map
tailscale status --peers
```

---

## 🔀 Windows Proxy Configuration

### Current Settings

| Setting       | Value                 |
| ------------- | --------------------- |
| Proxy Enabled | ❌ No (ProxyEnable=0) |
| Proxy Server  | `45.94.47.66:8118`    |
| Bypass for    | `<local>` addresses   |

**Note:** Proxy is configured but currently **disabled**. This is normal for local development.

### Enable Proxy (if needed)

```powershell
# Enable proxy
Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -Name ProxyEnable -Value 1

# Disable proxy
Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -Name ProxyEnable -Value 0
```

### Environment Variables (Optional)

```powershell
# Set HTTP proxy for applications
$env:HTTP_PROXY = "http://45.94.47.66:8118"
$env:HTTPS_PROXY = "http://45.94.47.66:8118"
$env:NO_PROXY = "localhost,127.0.0.1,.local,100.123.158.7"
```

---

## 🌐 Nginx Reverse Proxy

### Configuration Files Created

- ✅ `config/nginx/nginx.conf` - Main configuration
- ✅ `config/nginx/conf.d/default.conf` - Next.js proxy rules

### Features Configured

#### Load Balancing

- **Method:** Least connections
- **Backend:** `localhost:3000` (Next.js)
- **Max Failures:** 3
- **Fail Timeout:** 30 seconds
- **Keepalive Connections:** 32

#### Rate Limiting

| Zone            | Rate       | Burst | Purpose          |
| --------------- | ---------- | ----- | ---------------- |
| `general_limit` | 50 req/s   | 20    | General traffic  |
| `api_limit`     | 10 req/s   | 5     | API endpoints    |
| `conn_limit`    | 10 conn/ip | -     | Connection limit |

#### Real IP Detection

Configured for:

- ✅ Cloudflare IP ranges (all data centers)
- ✅ Tailscale network (`100.64.0.0/10`)
- ✅ Header: `CF-Connecting-IP`

#### Caching Strategy

| Resource                         | Cache Duration |
| -------------------------------- | -------------- |
| Static assets (`/_next/static/`) | 365 days       |
| Images (`/_next/image`)          | 7 days         |
| API routes                       | No cache       |

### Start Nginx (via Docker)

```powershell
# Start all services including Nginx
docker-compose up -d nginx

# Check Nginx logs
docker-compose logs -f nginx

# Reload configuration
docker-compose exec nginx nginx -s reload
```

### Test Nginx Configuration

```powershell
# Validate config without starting
docker-compose run --rm nginx nginx -t

# Test from browser
# http://localhost (HTTP)
# https://localhost (HTTPS - requires SSL cert)
```

---

## 🔧 Load Balancer Configuration

### Application Load Balancer

**File:** `lib/infrastructure/load-balancer.ts`

#### Limits

| Parameter             | Value | Purpose                         |
| --------------------- | ----- | ------------------------------- |
| Max Concurrent Users  | 50    | Support 30-40 users comfortably |
| Max Requests/Second   | 100   | Rate limiting                   |
| Request Timeout       | 30s   | Prevent hanging requests        |
| Retry Attempts        | 3     | Failure recovery                |
| Health Check Interval | 5s    | System monitoring               |

#### System Status Thresholds

- **HEALTHY:** < 70% capacity (< 35 users)
- **DEGRADED:** 70-90% capacity (35-45 users)
- **CRITICAL:** > 90% capacity (> 45 users)

### Metrics Tracked

- Active users count
- Requests per second
- Average response time
- Error rate
- CPU usage
- Memory usage
- Overall system status

---

## 🚀 Quick Start Guide

### Local Development (No Proxy)

```powershell
# Start Next.js directly
npm run dev

# Access at http://localhost:3000
```

### With Nginx Proxy

```powershell
# Start Next.js
npm run dev

# Start Nginx
docker-compose up -d nginx

# Access at http://localhost
```

### With Tailscale Remote Access

```powershell
# 1. Connect Tailscale
tailscale up

# 2. Start application
npm run dev

# 3. Access from any Tailscale device
# http://desktop-h7t9npm.taile382c0.ts.net:3000
# OR
# http://100.123.158.7:3000
```

---

## 🔐 Security Configuration

### Nginx Security Headers (Already Configured)

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### SSL/TLS (Production Ready)

```bash
# Update these paths in config/nginx/conf.d/default.conf
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;

# Protocols: TLS 1.2, TLS 1.3
# Ciphers: Modern ECDHE-based ciphers
```

### Tailscale Security

- ✅ End-to-end encryption (WireGuard)
- ✅ Zero-trust network access
- ✅ ACLs (Access Control Lists) - configure in Tailscale admin
- ✅ MagicDNS for easy device discovery

---

## 📊 Monitoring & Debugging

### Check Nginx Status

```powershell
# Is Nginx running?
docker-compose ps nginx

# View logs
docker-compose logs nginx

# Real-time logs
docker-compose logs -f nginx
```

### Check Tailscale Status

```powershell
# Detailed status
tailscale status

# Check peers
tailscale status --peers

# Test ping
tailscale ping <peer-name>

# Debug info
tailscale debug watch-ipn
```

### Check Load Balancer

```javascript
// In your application
import { loadBalancer } from '@/lib/infrastructure/load-balancer';

// Check if system can handle request
const canHandle = loadBalancer.canHandleRequest();
console.log(canHandle);

// Get current metrics
const metrics = loadBalancer.getMetrics();
console.log(metrics);
```

---

## 🐛 Troubleshooting

### Tailscale is Offline

```powershell
# Restart Tailscale service
Restart-Service Tailscale

# Check Windows firewall
Get-NetFirewallProfile | Select-Object Name, Enabled

# Reconnect
tailscale up

# Check network connectivity
tailscale ping 8.8.8.8
```

### Nginx Not Starting

```powershell
# Check configuration syntax
docker-compose run --rm nginx nginx -t

# Check port conflicts (80, 443)
netstat -ano | findstr ":80 "
netstat -ano | findstr ":443 "

# View detailed logs
docker-compose logs nginx
```

### Proxy Not Working

```powershell
# Check if proxy is enabled
Get-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings'

# Test direct connection
curl http://localhost:3000

# Test via proxy
curl http://localhost
```

---

## 📝 Next Steps

### Immediate Actions Required

1. ⚠️ **Update Tailscale:** Run `tailscale update`
2. ⚠️ **Reconnect Tailscale:** Run `tailscale up`
3. ✅ Test Nginx configuration
4. ✅ Configure SSL certificates (for HTTPS)

### Optional Enhancements

- Configure Tailscale ACLs for team access
- Set up Tailscale subnet routes
- Enable Tailscale MagicDNS
- Configure Tailscale exit nodes
- Add monitoring dashboards (Prometheus + Grafana)

---

## 📚 Additional Resources

- [Tailscale Documentation](https://tailscale.com/kb/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Load Balancer Implementation](./lib/infrastructure/load-balancer.ts)
