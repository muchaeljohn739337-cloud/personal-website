Write-Host "📧 Advancia Notification System" -ForegroundColor Cyan
param(
  [Parameter(Mandatory=$true)]
  [string]$Subject,
  
  [Parameter(Mandatory=$true)]
  [string]$Body,
  
  [Parameter(Mandatory=$false)]
  [ValidateSet("Info", "Warning", "Error", "Success")]
  [string]$Type = "Info"
)

$ErrorActionPreference = "Stop"

# Get admin email from environment
$adminEmail = $env:ADMIN_EMAIL
if (-not $adminEmail) {
  Write-Host "⚠️ ADMIN_EMAIL not set in environment. Notification skipped." -ForegroundColor Yellow
  exit 0
}

# Icon based on type
$icon = switch ($Type) {
  "Success" { "✅" }
  "Error" { "❌" }
  "Warning" { "⚠️" }
  default { "ℹ️" }
}

$fullSubject = "$icon $Subject - Advancia Pay Ledger"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"

$fullBody = @"
$Body

---
Timestamp: $timestamp
Environment: $($env:NODE_ENV ?? 'production')
Service: Advancia Pay Ledger RPA System

This is an automated notification from the Advancia deployment system.
"@

Write-Host "`n📧 Preparing notification..."
Write-Host "   To: $adminEmail"
Write-Host "   Subject: $fullSubject"
Write-Host "   Type: $Type"

# Try different notification methods

# Method 1: SendGrid (if configured)
if ($env:SENDGRID_API_KEY) {
  Write-Host "`n📮 Attempting SendGrid..."
  try {
    $headers = @{
      "Authorization" = "Bearer $env:SENDGRID_API_KEY"
      "Content-Type" = "application/json"
    }
    
    $payload = @{
      personalizations = @(
        @{
          to = @( @{ email = $adminEmail } )
          subject = $fullSubject
        }
      )
      from = @{ email = "noreply@advanciapayledger.com"; name = "Advancia RPA" }
      content = @(
        @{
          type = "text/plain"
          value = $fullBody
        }
      )
    } | ConvertTo-Json -Depth 10
    
    $response = Invoke-RestMethod -Uri "https://api.sendgrid.com/v3/mail/send" `
      -Method Post `
      -Headers $headers `
      -Body $payload
    
    Write-Host "✅ Email sent via SendGrid" -ForegroundColor Green
    exit 0
  } catch {
    Write-Host "❌ SendGrid failed: $($_.Exception.Message)" -ForegroundColor Red
  }
}

# Method 2: SMTP (if configured)
if ($env:SMTP_HOST -and $env:SMTP_USER -and $env:SMTP_PASSWORD) {
  Write-Host "`n📮 Attempting SMTP..."
  try {
    $smtpPassword = ConvertTo-SecureString $env:SMTP_PASSWORD -AsPlainText -Force
    $smtpCredential = New-Object System.Management.Automation.PSCredential ($env:SMTP_USER, $smtpPassword)
    
    $mailParams = @{
      To = $adminEmail
      From = $env:SMTP_FROM ?? "noreply@advanciapayledger.com"
      Subject = $fullSubject
      Body = $fullBody
      SmtpServer = $env:SMTP_HOST
      Port = $env:SMTP_PORT ?? 587
      UseSsl = $true
      Credential = $smtpCredential
    }
    
    Send-MailMessage @mailParams
    Write-Host "✅ Email sent via SMTP" -ForegroundColor Green
    exit 0
  } catch {
    Write-Host "❌ SMTP failed: $($_.Exception.Message)" -ForegroundColor Red
  }
}

# Method 3: GitHub Issue (fallback)
if ($env:GITHUB_TOKEN) {
  Write-Host "`n📮 Attempting GitHub Issue..."
  try {
    $issueBody = @"
## $fullSubject

$Body

**Details:**
- Timestamp: $timestamp
- Type: $Type
- Environment: $($env:NODE_ENV ?? 'production')

*This issue was automatically created by the Advancia RPA notification system.*
"@
    
    $payload = @{
      title = $fullSubject
      body = $issueBody
      labels = @("automated", "rpa", $Type.ToLower())
    } | ConvertTo-Json
    
    $headers = @{
      "Authorization" = "token $env:GITHUB_TOKEN"
      "Accept" = "application/vnd.github.v3+json"
    }
    
    $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$env:GITHUB_REPOSITORY/issues" `
      -Method Post `
      -Headers $headers `
      -Body $payload
    
    Write-Host "✅ GitHub issue created: $($response.html_url)" -ForegroundColor Green
    exit 0
  } catch {
    Write-Host "❌ GitHub issue failed: $($_.Exception.Message)" -ForegroundColor Red
  }
}

# Fallback: Console output only
Write-Host "`n⚠️ No notification method configured. Displaying locally only:" -ForegroundColor Yellow
Write-Host "`n$fullBody`n"
Write-Host "💡 To enable notifications, configure one of:" -ForegroundColor Cyan
Write-Host "   - SENDGRID_API_KEY for SendGrid"
Write-Host "   - SMTP_HOST, SMTP_USER, SMTP_PASSWORD for SMTP"
Write-Host "   - GITHUB_TOKEN for GitHub issues"
