# ==============================================================
# ADVANCIA WATCHDOG - SYSTEM HEALTH MONITOR
# ==============================================================
# Automated health checks for Backend, Frontend, Database
# Logs incidents, sends alerts, triggers auto-recovery
# Runs every 2 minutes via PM2 cron or manual execution
#
# Usage:
#   pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/watchdog.ps1

$ErrorActionPreference = 'Continue'

# ==============================================================
# CONFIGURATION
# ==============================================================

$config = @{
    BackendUrl = "http://localhost:4000/api/health"
    FrontendUrl = "http://localhost:3000"
    DatabaseCheck = $true
    TimeoutSeconds = 10
    AlertThresholds = @{
        ResponseTimeMs = 1000
        CpuPercent = 85
        MemoryPercent = 85
        DiskPercent = 90
    }
    LogDir = "logs"
    IncidentLog = "logs/incidents.json"
    MetricsLog = "logs/metrics.json"
    StatusFile = "logs/status.json"
    AlertEnabled = $true
}

# ==============================================================
# INITIALIZATION
# ==============================================================

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$reportTime = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"

# Ensure log directories exist
if (!(Test-Path $config.LogDir)) {
    New-Item -ItemType Directory -Force -Path $config.LogDir | Out-Null
}

Write-Host "🔍 Watchdog started at $timestamp" -ForegroundColor Cyan

# ==============================================================
# HELPER FUNCTIONS
# ==============================================================

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $logEntry = "[$timestamp] [$Level] $Message"
    $logFile = "logs/watchdog.log"
    Add-Content -Path $logFile -Value $logEntry
    
    switch ($Level) {
        "ERROR" { Write-Host "❌ $Message" -ForegroundColor Red }
        "WARN" { Write-Host "⚠️  $Message" -ForegroundColor Yellow }
        "SUCCESS" { Write-Host "✅ $Message" -ForegroundColor Green }
        default { Write-Host "ℹ️  $Message" -ForegroundColor White }
    }
}

function Send-Alert {
    param(
        [string]$Title,
        [string]$Message,
        [string]$Severity = "warning"
    )
    
    if (!$config.AlertEnabled) { return }
    
    Write-Log "Sending alert: $Title - $Message" "WARN"
    
    # Email alert
    try {
        $emailConfig = Get-Content "config/notifications.json" | ConvertFrom-Json
        if ($emailConfig.email.enabled) {
            $params = @{
                SmtpServer = $emailConfig.email.smtp_host
                Port = $emailConfig.email.smtp_port
                UseSsl = $true
                Credential = New-Object System.Management.Automation.PSCredential(
                    $emailConfig.email.smtp_user,
                    (ConvertTo-SecureString $emailConfig.email.smtp_password -AsPlainText -Force)
                )
                From = $emailConfig.email.smtp_user
                To = $emailConfig.email.recipients
                Subject = "[$Severity] Advancia Alert: $Title"
                Body = @"
Advancia Platform Alert
=======================

Severity: $Severity
Time: $timestamp
Title: $Title

Details:
$Message

---
Advancia Watchdog
"@
            }
            Send-MailMessage @params -ErrorAction SilentlyContinue
        }
    } catch {
        Write-Log "Failed to send email alert: $_" "ERROR"
    }
    
    # Slack webhook (optional)
    try {
        $slackConfig = Get-Content "config/notifications.json" | ConvertFrom-Json
        if ($slackConfig.slack.enabled) {
            $payload = @{
                text = "[$Severity] $Title"
                blocks = @(
                    @{
                        type = "header"
                        text = @{
                            type = "plain_text"
                            text = "🚨 Advancia Alert"
                        }
                    },
                    @{
                        type = "section"
                        fields = @(
                            @{ type = "mrkdwn"; text = "*Severity:*`n$Severity" },
                            @{ type = "mrkdwn"; text = "*Time:*`n$timestamp" }
                        )
                    },
                    @{
                        type = "section"
                        text = @{
                            type = "mrkdwn"
                            text = "*$Title*`n$Message"
                        }
                    }
                )
            } | ConvertTo-Json -Depth 10
            
            Invoke-RestMethod -Uri $slackConfig.slack.webhook_url -Method Post -Body $payload -ContentType "application/json" -ErrorAction SilentlyContinue
        }
    } catch {
        Write-Log "Failed to send Slack alert: $_" "ERROR"
    }
}

function Log-Incident {
    param(
        [string]$Title,
        [string]$Description,
        [string]$Severity,
        [string]$Component
    )
    
    $incident = @{
        timestamp = $reportTime
        title = $Title
        description = $Description
        severity = $Severity
        component = $Component
        resolved = $false
        resolution_time = $null
    }
    
    $incidents = @()
    if (Test-Path $config.IncidentLog) {
        $incidents = Get-Content $config.IncidentLog | ConvertFrom-Json
    }
    
    $incidents += $incident
    $incidents | ConvertTo-Json -Depth 10 | Set-Content $config.IncidentLog
    
    Write-Log "Incident logged: $Title" "WARN"
}

function Log-Metric {
    param([hashtable]$Metric)
    
    $metric = $Metric + @{ timestamp = $reportTime }
    
    $metrics = @()
    if (Test-Path $config.MetricsLog) {
        $metrics = Get-Content $config.MetricsLog | ConvertFrom-Json
    }
    
    $metrics += $metric
    
    # Keep only last 10,000 metrics
    if ($metrics.Count -gt 10000) {
        $metrics = $metrics[-10000..-1]
    }
    
    $metrics | ConvertTo-Json -Depth 10 | Set-Content $config.MetricsLog
}

# ==============================================================
# HEALTH CHECK FUNCTIONS
# ==============================================================

function Test-Backend {
    Write-Host "`n🔧 Testing Backend..." -ForegroundColor Cyan
    
    try {
        $start = Get-Date
        $response = Invoke-WebRequest -Uri $config.BackendUrl -Method GET -TimeoutSec $config.TimeoutSeconds -UseBasicParsing
        $duration = ((Get-Date) - $start).TotalMilliseconds
        
        if ($response.StatusCode -eq 200) {
            Write-Log "Backend healthy (${duration}ms)" "SUCCESS"
            
            Log-Metric -Metric @{
                component = "backend"
                status = "healthy"
                response_time_ms = [math]::Round($duration, 2)
                status_code = $response.StatusCode
            }
            
            if ($duration -gt $config.AlertThresholds.ResponseTimeMs) {
                Send-Alert -Title "Backend Slow Response" -Message "Response time: ${duration}ms (threshold: $($config.AlertThresholds.ResponseTimeMs)ms)" -Severity "warning"
            }
            
            return @{ status = "healthy"; response_time = $duration }
        } else {
            Write-Log "Backend returned non-200 status: $($response.StatusCode)" "WARN"
            return @{ status = "degraded"; response_time = $duration }
        }
    } catch {
        Write-Log "Backend check failed: $_" "ERROR"
        
        Log-Incident -Title "Backend Unavailable" -Description "Health check failed: $_" -Severity "critical" -Component "backend"
        Send-Alert -Title "Backend Down" -Message "Backend API is not responding. Error: $_" -Severity "critical"
        
        # Attempt auto-recovery
        Write-Log "Attempting auto-recovery: Restarting backend..." "WARN"
        pm2 restart advancia-backend 2>&1 | Out-Null
        
        return @{ status = "down"; response_time = 0 }
    }
}

function Test-Frontend {
    Write-Host "`n🎨 Testing Frontend..." -ForegroundColor Cyan
    
    try {
        $start = Get-Date
        $response = Invoke-WebRequest -Uri $config.FrontendUrl -Method GET -TimeoutSec $config.TimeoutSeconds -UseBasicParsing
        $duration = ((Get-Date) - $start).TotalMilliseconds
        
        if ($response.StatusCode -eq 200) {
            Write-Log "Frontend healthy (${duration}ms)" "SUCCESS"
            
            Log-Metric -Metric @{
                component = "frontend"
                status = "healthy"
                response_time_ms = [math]::Round($duration, 2)
                status_code = $response.StatusCode
            }
            
            return @{ status = "healthy"; response_time = $duration }
        } else {
            Write-Log "Frontend returned non-200 status: $($response.StatusCode)" "WARN"
            return @{ status = "degraded"; response_time = $duration }
        }
    } catch {
        Write-Log "Frontend check failed: $_" "ERROR"
        
        Log-Incident -Title "Frontend Unavailable" -Description "Health check failed: $_" -Severity "critical" -Component "frontend"
        Send-Alert -Title "Frontend Down" -Message "Frontend app is not responding. Error: $_" -Severity "critical"
        
        # Attempt auto-recovery
        Write-Log "Attempting auto-recovery: Restarting frontend..." "WARN"
        pm2 restart advancia-frontend 2>&1 | Out-Null
        
        return @{ status = "down"; response_time = 0 }
    }
}

function Test-Database {
    Write-Host "`n🗄️  Testing Database..." -ForegroundColor Cyan
    
    if (!$config.DatabaseCheck) {
        Write-Log "Database check disabled" "INFO"
        return @{ status = "skipped" }
    }
    
    try {
        Push-Location "backend"
        $start = Get-Date
        $result = npx prisma db execute --stdin <<< "SELECT 1 as health_check;" 2>&1
        $duration = ((Get-Date) - $start).TotalMilliseconds
        Pop-Location
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Database healthy (${duration}ms)" "SUCCESS"
            
            Log-Metric -Metric @{
                component = "database"
                status = "healthy"
                response_time_ms = [math]::Round($duration, 2)
            }
            
            return @{ status = "healthy"; response_time = $duration }
        } else {
            Write-Log "Database check failed with exit code $LASTEXITCODE" "ERROR"
            return @{ status = "degraded"; response_time = $duration }
        }
    } catch {
        Write-Log "Database check failed: $_" "ERROR"
        
        Log-Incident -Title "Database Connection Failed" -Description "Cannot connect to PostgreSQL: $_" -Severity "critical" -Component "database"
        Send-Alert -Title "Database Down" -Message "PostgreSQL connection failed. Error: $_" -Severity "critical"
        
        return @{ status = "down"; response_time = 0 }
    }
}

function Test-PM2Processes {
    Write-Host "`n📦 Testing PM2 Processes..." -ForegroundColor Cyan
    
    try {
        $pm2Status = pm2 jlist | ConvertFrom-Json
        
        foreach ($proc in $pm2Status) {
            $name = $proc.name
            $status = $proc.pm2_env.status
            $cpu = $proc.monit.cpu
            $memory = [math]::Round($proc.monit.memory / 1MB, 2)
            
            if ($status -eq "online") {
                Write-Log "Process $name: $status (CPU: ${cpu}%, Memory: ${memory}MB)" "SUCCESS"
                
                # Check CPU threshold
                if ($cpu -gt $config.AlertThresholds.CpuPercent) {
                    Send-Alert -Title "High CPU Usage: $name" -Message "CPU usage: ${cpu}% (threshold: $($config.AlertThresholds.CpuPercent)%)" -Severity "warning"
                }
                
                # Check memory threshold
                $memPercent = ($proc.monit.memory / (Get-WmiObject Win32_ComputerSystem).TotalPhysicalMemory) * 100
                if ($memPercent -gt $config.AlertThresholds.MemoryPercent) {
                    Send-Alert -Title "High Memory Usage: $name" -Message "Memory usage: ${memPercent}% (threshold: $($config.AlertThresholds.MemoryPercent)%)" -Severity "warning"
                }
            } else {
                Write-Log "Process $name is $status" "ERROR"
                
                Log-Incident -Title "Process Stopped: $name" -Description "PM2 process is in $status state" -Severity "high" -Component "pm2"
                Send-Alert -Title "Process Down: $name" -Message "PM2 process is $status. Attempting restart..." -Severity "high"
                
                pm2 restart $name 2>&1 | Out-Null
            }
        }
        
        return @{ status = "healthy"; process_count = $pm2Status.Count }
    } catch {
        Write-Log "PM2 check failed: $_" "ERROR"
        return @{ status = "unknown" }
    }
}

function Test-DiskSpace {
    Write-Host "`n💾 Testing Disk Space..." -ForegroundColor Cyan
    
    try {
        $drive = Get-PSDrive -Name C
        $usedPercent = [math]::Round(($drive.Used / ($drive.Used + $drive.Free)) * 100, 2)
        $freeGB = [math]::Round($drive.Free / 1GB, 2)
        
        Write-Log "Disk usage: ${usedPercent}% (${freeGB}GB free)" "INFO"
        
        Log-Metric -Metric @{
            component = "disk"
            used_percent = $usedPercent
            free_gb = $freeGB
        }
        
        if ($usedPercent -gt $config.AlertThresholds.DiskPercent) {
            Send-Alert -Title "Low Disk Space" -Message "Disk usage: ${usedPercent}% (threshold: $($config.AlertThresholds.DiskPercent)%)" -Severity "warning"
        }
        
        return @{ status = "healthy"; used_percent = $usedPercent; free_gb = $freeGB }
    } catch {
        Write-Log "Disk space check failed: $_" "ERROR"
        return @{ status = "unknown" }
    }
}

function Test-SSLCertificate {
    Write-Host "`n🔒 Testing SSL Certificate..." -ForegroundColor Cyan
    
    try {
        $url = "https://advanciapayledger.com"
        $request = [System.Net.HttpWebRequest]::Create($url)
        $request.Timeout = 10000
        $response = $request.GetResponse()
        $cert = $request.ServicePoint.Certificate
        
        if ($cert) {
            $expiryDate = [DateTime]::Parse($cert.GetExpirationDateString())
            $daysUntilExpiry = ($expiryDate - (Get-Date)).Days
            
            Write-Log "SSL certificate expires in $daysUntilExpiry days" "INFO"
            
            if ($daysUntilExpiry -lt 30) {
                Send-Alert -Title "SSL Certificate Expiring Soon" -Message "Certificate expires in $daysUntilExpiry days on $expiryDate" -Severity "warning"
            }
            
            return @{ status = "valid"; days_until_expiry = $daysUntilExpiry }
        }
    } catch {
        Write-Log "SSL certificate check failed: $_" "WARN"
        return @{ status = "unknown" }
    }
}

# ==============================================================
# MAIN EXECUTION
# ==============================================================

Write-Host "`n═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ADVANCIA WATCHDOG - HEALTH CHECK CYCLE  " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan

# Run all health checks
$results = @{
    timestamp = $reportTime
    backend = Test-Backend
    frontend = Test-Frontend
    database = Test-Database
    pm2 = Test-PM2Processes
    disk = Test-DiskSpace
    ssl = Test-SSLCertificate
}

# Calculate overall status
$overallStatus = "healthy"
if ($results.backend.status -eq "down" -or $results.frontend.status -eq "down" -or $results.database.status -eq "down") {
    $overallStatus = "down"
} elseif ($results.backend.status -eq "degraded" -or $results.frontend.status -eq "degraded") {
    $overallStatus = "degraded"
}

$results.overall_status = $overallStatus

# Save status file for UI
$results | ConvertTo-Json -Depth 10 | Set-Content $config.StatusFile

# ==============================================================
# SUMMARY
# ==============================================================

Write-Host "`n═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "           HEALTH CHECK SUMMARY           " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan

$statusColor = switch ($overallStatus) {
    "healthy" { "Green" }
    "degraded" { "Yellow" }
    "down" { "Red" }
    default { "Gray" }
}

Write-Host "`nOverall Status: " -NoNewline
Write-Host $overallStatus.ToUpper() -ForegroundColor $statusColor

Write-Host "`nComponent Status:" -ForegroundColor Cyan
Write-Host "  Backend:   $($results.backend.status) ($($results.backend.response_time)ms)"
Write-Host "  Frontend:  $($results.frontend.status) ($($results.frontend.response_time)ms)"
Write-Host "  Database:  $($results.database.status)"
Write-Host "  PM2:       $($results.pm2.status)"
Write-Host "  Disk:      $($results.disk.used_percent)% used"
Write-Host "  SSL:       $($results.ssl.status)"

Write-Host "`n✅ Watchdog completed at $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════`n" -ForegroundColor Cyan

exit 0
