# Enhanced Notify function with BurntToast, Event Log, and MessageBox fallbacks
function Notify($message, $type = "Info") {
  $icon = switch ($type) {
    "Success" { "✅" }
    "Error" { "❌" }
    "Warning" { "⚠️" }
    default { "ℹ️" }
  }
  
  $fullMessage = "$icon $message"
  
  # Console notification (always show)
  Write-Host "`n$fullMessage" -ForegroundColor $(switch ($type) {
    "Success" { "Green" }
    "Error" { "Red" }
    "Warning" { "Yellow" }
    default { "Cyan" }
  })
  
  # Advanced notification chain
  $summaryTitle = "Advancia RPA Deploy"
  $summaryBody = $message
  
  try {
    # Method 1: BurntToast module (best for Windows 10+)
    if (Get-Module -ListAvailable -Name BurntToast) {
      Import-Module BurntToast -ErrorAction Stop
      
      # Customize based on type
      $params = @{
        Text = $summaryTitle, $summaryBody
      }
      
      # Add sound for errors/warnings
      if ($type -eq "Error" -or $type -eq "Warning") {
        $params.Sound = 'Default'
      }
      
      New-BurntToastNotification @params
      Write-Host "   📬 Toast notification sent" -ForegroundColor DarkGray
    } 
    else {
      # Method 2: Windows Event Log
      $eventSource = "AdvanciaRPA"
      $eventType = switch ($type) {
        "Success" { "Information" }
        "Error" { "Error" }
        "Warning" { "Warning" }
        default { "Information" }
      }
      
      # Create event source if it doesn't exist (requires admin once)
      if (-not [System.Diagnostics.EventLog]::SourceExists($eventSource)) {
        try {
          New-EventLog -LogName Application -Source $eventSource
          Write-Host "   📝 Created Event Log source: $eventSource" -ForegroundColor DarkGray
        } catch {
          # Silently fail if no admin rights
        }
      }
      
      # Write to Event Log
      try {
        $eventId = switch ($type) {
          "Success" { 1001 }
          "Error" { 3001 }
          "Warning" { 2001 }
          default { 1000 }
        }
        
        Write-EventLog -LogName Application -Source $eventSource `
          -EntryType $eventType -EventId $eventId `
          -Message "$summaryTitle`n$summaryBody"
        
        Write-Host "   📋 Logged to Windows Event Viewer" -ForegroundColor DarkGray
      } catch {
        # Silently fail if no permissions
      }
      
      # Method 3: MessageBox (when running interactively)
      if ([Environment]::UserInteractive) {
        try {
          [void][System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms')
          
          $iconType = switch ($type) {
            "Success" { [System.Windows.Forms.MessageBoxIcon]::Information }
            "Error" { [System.Windows.Forms.MessageBoxIcon]::Error }
            "Warning" { [System.Windows.Forms.MessageBoxIcon]::Warning }
            default { [System.Windows.Forms.MessageBoxIcon]::Information }
          }
          
          [System.Windows.Forms.MessageBox]::Show(
            $summaryBody,
            $summaryTitle,
            [System.Windows.Forms.MessageBoxButtons]::OK,
            $iconType
          ) | Out-Null
          
          Write-Host "   💬 MessageBox displayed" -ForegroundColor DarkGray
        } catch {
          # Silently fail if Forms not available
        }
      }
    }
  } catch {
    Write-Host "   ⚠️ Desktop notification unavailable" -ForegroundColor DarkGray
  }
  
  # Method 4: Always write to summary log file
  try {
    $sumDir = Join-Path $PSScriptRoot "..\logs"
    if (!(Test-Path $sumDir)) { 
      New-Item -ItemType Directory -Path $sumDir | Out-Null 
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "$timestamp  [$type] $summaryTitle — $summaryBody"
    
    $logFile = Join-Path $sumDir "nightly-summary.txt"
    $logEntry | Out-File $logFile -Append -Encoding UTF8
    
    Write-Host "   📄 Logged to: logs\nightly-summary.txt" -ForegroundColor DarkGray
  } catch {
    # Last resort: just continue
  }
}
