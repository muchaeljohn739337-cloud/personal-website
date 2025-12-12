# ✅ Advancia Status Page - Solo Operator Checklist

**Purpose:** Daily, weekly, and monthly operational tasks for maintaining the status monitoring system.

---

## 🌅 Daily Checks (5 minutes)

### Morning Health Verification

- [ ] **Visit status page**: https://status.advanciapayledger.com
  - Overall status should show **green (healthy)**
  - All components showing **✅ operational**
- [ ] **Check PM2 status**

  ```bash
  pm2 status
  ```

  - `advancia-backend` should be **online**
  - `advancia-frontend` should be **online**
  - `advancia-watchdog` should be **online** (or **stopped** if cron-based)

- [ ] **Review alert inbox**

  - Check email: `admin@advanciapayledger.com` for alerts
  - Check Slack (if enabled) for notifications
  - **Expected:** No alerts in last 24h (or only test alerts)

- [ ] **Scan recent incidents**
  ```bash
  cat logs/incidents.json | jq '.[-5:]' # Last 5 incidents
  ```
  - **Expected:** Empty array `[]` or only resolved incidents

### Quick Response Time Check

- [ ] **Test backend API**

  ```bash
  curl -w "@curl-format.txt" http://localhost:4000/api/health
  ```

  - Response time should be **<200ms**
  - Status code: **200**

- [ ] **Test frontend**
  ```bash
  curl -w "@curl-format.txt" http://localhost:3000
  ```
  - Response time should be **<500ms**
  - Status code: **200**

### Disk Space Verification

- [ ] **Check available disk space**
  ```bash
  df -h
  ```
  - Root partition (`/`) should be **<70% used**
  - Logs partition should have **>5GB free**

---

## 📅 Weekly Checks (15 minutes)

### Performance Review

- [ ] **Generate uptime report**

  ```bash
  pwsh scripts/uptime-report.ps1 --days 7
  ```

  - **Target:** 99.9% uptime (7 days)
  - **Action if <99%:** Review incidents, identify patterns

- [ ] **Review incident log**

  ```bash
  cat logs/incidents.json | jq '[.[] | select(.timestamp | startswith("2025-11"))] | length'
  ```

  - Count incidents this month
  - **Target:** <5 incidents/week
  - **Action if >5:** Investigate root causes

- [ ] **Check average response times**
  ```bash
  cat logs/metrics.json | jq '[.[] | select(.component == "backend") | .response_time_ms] | add/length'
  ```
  - **Target:** <300ms average
  - **Action if >500ms:** Optimize backend, add caching

### Resource Optimization

- [ ] **Review PM2 memory usage**

  ```bash
  pm2 list
  ```

  - Backend memory should be **<400MB**
  - Frontend memory should be **<300MB**
  - **Action if exceeded:** `pm2 restart advancia-backend`

- [ ] **Check log file sizes**

  ```bash
  du -sh logs/*.log
  ```

  - Individual logs should be **<50MB**
  - **Action if >50MB:** Verify log rotation is working

- [ ] **Archive old logs**
  ```bash
  pwsh scripts/archive-logs.ps1 --older-than 7
  ```
  - Moves logs >7 days to `logs/archive/`
  - Compresses archives

### Database Maintenance

- [ ] **Run database health check**

  ```bash
  cd backend && npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"User\";"
  ```

  - Should return row count without errors
  - **Action if fails:** Check PostgreSQL service, connection string

- [ ] **Check database size**
  ```bash
  cd backend && npx prisma db execute --stdin <<< "SELECT pg_size_pretty(pg_database_size(current_database()));"
  ```
  - **Note size for growth tracking**
  - **Action if >5GB:** Review data retention policies

---

## 📆 Monthly Checks (30 minutes)

### Comprehensive Uptime Analysis

- [ ] **Generate 30-day uptime report**

  ```bash
  pwsh scripts/uptime-report.ps1 --days 30
  ```

  - **Target:** 99.9% uptime (30 days)
  - **Review:** Patterns (time of day, day of week)
  - **Action:** Schedule maintenance during low-traffic windows

- [ ] **Incident trend analysis**

  ```bash
  cat logs/incidents.json | jq 'group_by(.severity) | map({severity: .[0].severity, count: length})'
  ```

  - Count by severity: **critical**, **high**, **medium**, **low**
  - **Trend:** Should be decreasing month-over-month

- [ ] **Response time trends**
  ```bash
  cat logs/metrics.json | jq '[.[] | select(.component == "backend")] | group_by(.timestamp[0:10]) | map({date: .[0].timestamp[0:10], avg_ms: (map(.response_time_ms) | add/length)})'
  ```
  - Graph daily averages
  - **Action if increasing:** Investigate performance bottlenecks

### Security & Compliance

- [ ] **Check SSL certificate expiration**

  ```bash
  echo | openssl s_client -servername advanciapayledger.com -connect advanciapayledger.com:443 2>/dev/null | openssl x509 -noout -dates
  ```

  - Note expiration date
  - **Action if <30 days:** Run `sudo certbot renew`

- [ ] **Review access logs for anomalies**

  ```bash
  sudo tail -500 /var/log/nginx/status-access.log | grep -v "GET /status" | sort | uniq -c | sort -rn
  ```

  - Look for unusual patterns, IPs, or requests
  - **Action if suspicious:** Block IP in firewall, review security

- [ ] **Test alert delivery**
  ```bash
  pwsh scripts/test-notifications.ps1
  ```
  - Should receive test email/Slack message
  - **Action if fails:** Check SMTP credentials, webhook URLs

### Dependency Updates

- [ ] **Check for PM2 updates**

  ```bash
  npm outdated -g pm2
  ```

  - **Action if outdated:** `npm update -g pm2`

- [ ] **Check for Nginx updates** (Linux)

  ```bash
  sudo apt update && sudo apt list --upgradable | grep nginx
  ```

  - **Action if available:** `sudo apt upgrade nginx`

- [ ] **Review backend/frontend dependencies**
  ```bash
  cd backend && npm outdated
  cd ../frontend && npm outdated
  ```
  - **Note critical security updates**
  - **Action:** Schedule update window, test in staging

### Database Optimization

- [ ] **Run PostgreSQL VACUUM ANALYZE**

  ```bash
  cd backend && npx prisma db execute --stdin <<< "VACUUM ANALYZE;"
  ```

  - Optimizes database performance
  - Reclaims storage space

- [ ] **Check slow query log** (if enabled)
  ```bash
  sudo tail -100 /var/log/postgresql/postgresql-*.log | grep "duration:"
  ```
  - Identify queries >100ms
  - **Action:** Add indexes, optimize queries

### Backup Verification

- [ ] **Verify database backups exist**

  ```bash
  ls -lh /backups/postgres/*.sql | tail -7
  ```

  - Should have 7 daily backups
  - **Action if missing:** Check cron job, disk space

- [ ] **Test backup restoration** (once per quarter)
  ```bash
  # Create test database
  createdb advancia_test
  # Restore latest backup
  psql advancia_test < /backups/postgres/latest.sql
  # Verify data integrity
  psql advancia_test -c "SELECT COUNT(*) FROM \"User\";"
  # Cleanup
  dropdb advancia_test
  ```
  - **Target:** Restoration completes without errors

---

## 🚨 Incident Response Checklist

### When Alert Fires

- [ ] **1. Acknowledge alert**

  - Reply to email or click Slack acknowledgment
  - Note time of alert

- [ ] **2. Check current status**

  ```bash
  pm2 status
  cat logs/status.json | jq .overall_status
  ```

- [ ] **3. Identify affected component**

  - Backend, Frontend, Database, or Infrastructure

- [ ] **4. Review recent logs**

  ```bash
  pm2 logs advancia-backend --lines 50 --err
  pm2 logs advancia-frontend --lines 50 --err
  ```

- [ ] **5. Attempt quick fix**

  - Restart service: `pm2 restart advancia-<service>`
  - Wait 30 seconds, re-check status

- [ ] **6. If persists, escalate checks**

  - Check database: `cd backend && npx prisma studio`
  - Check disk space: `df -h`
  - Check memory: `free -m`
  - Check network: `ping 8.8.8.8`

- [ ] **7. Document incident**

  ```bash
  pwsh scripts/log-incident.ps1 \
    --severity "high" \
    --title "Backend API Timeout" \
    --description "Response time exceeded 5s" \
    --resolution "Restarted backend service"
  ```

- [ ] **8. Verify resolution**

  - Check status page shows green
  - Test affected functionality manually
  - Monitor for 15 minutes

- [ ] **9. Post-incident review** (within 24h)
  - Root cause analysis
  - Document learnings
  - Update runbooks if needed

---

## 🎯 Quarterly Reviews (1 hour)

### Strategic Health Assessment

- [ ] **90-day uptime report**

  ```bash
  pwsh scripts/uptime-report.ps1 --days 90
  ```

  - **Target:** 99.95% uptime
  - Compare to previous quarter

- [ ] **Incident pattern analysis**

  - Group by time of day, day of week, component
  - Identify recurring issues
  - **Action:** Create preventive measures

- [ ] **Capacity planning**
  - Review traffic trends
  - Check database growth rate
  - Estimate 6-month resource needs
  - **Action:** Upgrade plan if needed

### Security Audit

- [ ] **Review all access logs**

  ```bash
  sudo cat /var/log/nginx/status-access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -20
  ```

  - Identify top IPs accessing status page
  - **Action:** Allowlist known IPs if desired

- [ ] **Check for unauthorized access attempts**

  ```bash
  sudo grep "401\|403" /var/log/nginx/status-access.log | tail -50
  ```

  - **Action:** Block suspicious IPs

- [ ] **Review notification credentials**
  - Rotate SMTP password
  - Regenerate Slack webhook if needed
  - Update `status-page/config/notifications.json`

### Documentation Updates

- [ ] **Update runbooks**

  - Add any new procedures discovered
  - Remove obsolete steps

- [ ] **Review README accuracy**

  - Verify commands still work
  - Update versions, URLs

- [ ] **Check for tool updates**
  - PM2, Nginx, Certbot versions
  - Note compatibility issues

---

## 📊 Key Metrics Dashboard

### Target SLAs (Service Level Agreements)

| Metric                       | Target | Warning | Critical |
| ---------------------------- | ------ | ------- | -------- |
| **Uptime**                   | ≥99.9% | <99.5%  | <99%     |
| **Backend Response Time**    | <200ms | >500ms  | >1000ms  |
| **Frontend Load Time**       | <500ms | >1000ms | >3000ms  |
| **Database Query Time**      | <50ms  | >200ms  | >500ms   |
| **Incident Resolution Time** | <15min | >30min  | >1hr     |
| **Alert Response Time**      | <5min  | >15min  | >30min   |

### Monthly Reporting

- [ ] **Generate monthly report**

  ```bash
  pwsh scripts/monthly-report.ps1 --month $(date +%m) --year $(date +%Y)
  ```

  - Uptime percentage
  - Total incidents
  - Average response time
  - Resource utilization

- [ ] **Share report** (optional)
  - Email to stakeholders
  - Post in team channel
  - Archive in `/reports/` folder

---

## 🛠️ Emergency Contacts & Resources

### Quick Reference

- **Status Page URL**: https://status.advanciapayledger.com
- **Server IP**: [Your server IP]
- **SSH Access**: `ssh user@server-ip`
- **PM2 Home**: `~/.pm2/`
- **Logs Directory**: `/var/www/advancia/logs/`

### Emergency Commands

```bash
# Restart all services
pm2 restart all

# Check system resources
top -bn1 | head -20

# Check disk space
df -h

# View last 100 errors
grep -i error /var/www/advancia/logs/*.log | tail -100

# Emergency database backup
pg_dump advancia_db > /tmp/emergency_backup_$(date +%Y%m%d_%H%M%S).sql

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx errors
sudo tail -50 /var/log/nginx/error.log
```

### Escalation Path

1. **Try automated recovery**: PM2 restart, Nginx reload
2. **Review logs**: Identify error patterns
3. **Check infrastructure**: Disk, memory, network
4. **Database maintenance**: Restart PostgreSQL if needed
5. **Restore from backup**: Last resort if corruption detected
6. **Contact support**: Cloud provider, database vendor

---

## 📝 Operational Notes

### Best Practices

✅ **DO:**

- Check status page first thing every morning
- Respond to alerts within 5 minutes
- Document all incidents, even minor ones
- Keep alert thresholds realistic
- Archive logs regularly
- Test backups quarterly

❌ **DON'T:**

- Ignore "minor" alerts (they accumulate)
- Skip weekly checks (drift compounds)
- Run production commands without testing
- Delete logs without archiving first
- Disable monitoring "temporarily" (it stays off)
- Modify production configs without version control

### Time Estimates

| Task                | Frequency | Duration      |
| ------------------- | --------- | ------------- |
| Daily checks        | Daily     | 5 minutes     |
| Weekly review       | Weekly    | 15 minutes    |
| Monthly audit       | Monthly   | 30 minutes    |
| Quarterly review    | Quarterly | 1 hour        |
| Incident response   | As needed | 15-60 minutes |
| **Total per month** | -         | **~2 hours**  |

---

**Checklist Version:** 1.0.0  
**Last Updated:** November 30, 2025  
**Solo Operator:** Advancia Platform  
**Status Page:** Production-Ready
