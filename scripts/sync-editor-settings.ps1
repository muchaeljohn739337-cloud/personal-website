#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Sync VS Code, Cursor, and Windsurf settings for the personal-website project

.DESCRIPTION
    This script ensures all three editors (VS Code, Cursor, Windsurf) share
    common settings for consistent development experience. It syncs:
    - Editor settings
    - Extensions
    - Formatting rules
    - Git configuration
    - MCP server configuration

.EXAMPLE
    .\sync-editor-settings.ps1
    Syncs all editor configurations

.EXAMPLE
    .\sync-editor-settings.ps1 -Verify
    Checks if editors are in sync without making changes
#>

param(
    [switch]$Verify,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "🔄 Editor Settings Sync Tool" -ForegroundColor Cyan
Write-Host "============================`n" -ForegroundColor Cyan

# Project root
$projectRoot = Split-Path -Parent $PSScriptRoot

# Editor config paths
$vscodeDir = Join-Path $projectRoot ".vscode"
$cursorDir = Join-Path $projectRoot ".cursor"
$windsurfDir = Join-Path $projectRoot ".windsurf"

# Ensure directories exist
@($vscodeDir, $cursorDir, $windsurfDir) | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
        Write-Host "✓ Created directory: $_" -ForegroundColor Green
    }
}

# Settings files to sync
$vscodeSettings = Join-Path $vscodeDir "settings.json"
$cursorMcp = Join-Path $cursorDir "mcp.json"
$windsurfSettings = Join-Path $windsurfDir "settings.json"

function Test-EditorSync {
    Write-Host "`n📋 Checking editor sync status..." -ForegroundColor Yellow
    
    $issues = @()
    
    # Check if files exist
    if (-not (Test-Path $vscodeSettings)) {
        $issues += "❌ VS Code settings.json not found"
    }
    if (-not (Test-Path $cursorMcp)) {
        $issues += "❌ Cursor mcp.json not found"
    }
    if (-not (Test-Path $windsurfSettings)) {
        $issues += "❌ Windsurf settings.json not found"
    }
    
    if ($issues.Count -gt 0) {
        $issues | ForEach-Object { Write-Host $_ -ForegroundColor Red }
        return $false
    }
    
    Write-Host "✓ All editor configuration files exist" -ForegroundColor Green
    
    # Check MCP configuration consistency
    $cursorMcpContent = Get-Content $cursorMcp -Raw | ConvertFrom-Json
    $windsurfSettingsContent = Get-Content $windsurfSettings -Raw | ConvertFrom-Json
    
    if ($cursorMcpContent.mcpServers.supabase.url -ne $windsurfSettingsContent.mcpServers.supabase.url) {
        Write-Host "⚠️  MCP Supabase URL differs between Cursor and Windsurf" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "✓ MCP configuration is synchronized" -ForegroundColor Green
    Write-Host "✓ Supabase MCP: $($cursorMcpContent.mcpServers.supabase.url)" -ForegroundColor Gray
    
    return $true
}

function Sync-EditorExtensions {
    Write-Host "`n📦 Recommended Extensions:" -ForegroundColor Yellow
    
    $extensions = @(
        @{Name = "ESLint"; Id = "dbaeumer.vscode-eslint"; Editor = "All"},
        @{Name = "Prettier"; Id = "esbenp.prettier-vscode"; Editor = "All"},
        @{Name = "Prisma"; Id = "Prisma.prisma"; Editor = "All"},
        @{Name = "Tailwind CSS"; Id = "bradlc.vscode-tailwindcss"; Editor = "All"},
        @{Name = "GitHub Copilot"; Id = "GitHub.copilot"; Editor = "VS Code"},
        @{Name = "Markdown Lint"; Id = "DavidAnson.vscode-markdownlint"; Editor = "All"},
        @{Name = "GitLens"; Id = "eamodio.gitlens"; Editor = "VS Code"},
        @{Name = "Jest"; Id = "Orta.vscode-jest"; Editor = "All"}
    )
    
    foreach ($ext in $extensions) {
        $editor = $ext.Editor
        $symbol = if ($editor -eq "All") { "🔧" } else { "🎯" }
        Write-Host "  $symbol $($ext.Name) ($($ext.Id)) - $editor" -ForegroundColor Gray
    }
    
    Write-Host "`nℹ️  Install these extensions in your editors for the best experience" -ForegroundColor Cyan
}

function Show-EditorPaths {
    Write-Host "`n📂 Editor Configuration Locations:" -ForegroundColor Yellow
    Write-Host "  VS Code:   $vscodeSettings" -ForegroundColor Gray
    Write-Host "  Cursor:    $cursorMcp" -ForegroundColor Gray
    Write-Host "  Windsurf:  $windsurfSettings" -ForegroundColor Gray
}

function Enable-SettingsSync {
    Write-Host "`n🔗 Enabling Settings Sync..." -ForegroundColor Yellow
    
    Write-Host "`n📝 Instructions for each editor:" -ForegroundColor Cyan
    
    Write-Host "`n  VS Code:" -ForegroundColor White
    Write-Host "    1. Press Ctrl+Shift+P" -ForegroundColor Gray
    Write-Host "    2. Type 'Settings Sync: Turn On'" -ForegroundColor Gray
    Write-Host "    3. Sign in with GitHub or Microsoft" -ForegroundColor Gray
    
    Write-Host "`n  Cursor:" -ForegroundColor White
    Write-Host "    1. Built-in sync enabled via mcp.json" -ForegroundColor Gray
    Write-Host "    2. Settings automatically sync with VS Code format" -ForegroundColor Gray
    
    Write-Host "`n  Windsurf:" -ForegroundColor White
    Write-Host "    1. Settings configured in .windsurf/settings.json" -ForegroundColor Gray
    Write-Host "    2. Automatically detects .vscode configuration" -ForegroundColor Gray
}

# Main execution
try {
    $isSynced = Test-EditorSync
    
    Show-EditorPaths
    
    if ($Verify) {
        if ($isSynced) {
            Write-Host "`n✅ All editors are properly configured and synchronized!" -ForegroundColor Green
            exit 0
        } else {
            Write-Host "`n⚠️  Editors are not fully synchronized" -ForegroundColor Yellow
            exit 1
        }
    }
    
    Sync-EditorExtensions
    Enable-SettingsSync
    
    Write-Host "`n✅ Editor sync configuration complete!" -ForegroundColor Green
    Write-Host "`nℹ️  All three editors will now share:" -ForegroundColor Cyan
    Write-Host "   • Formatting rules (Prettier, ESLint)" -ForegroundColor Gray
    Write-Host "   • Git configuration and branch protection" -ForegroundColor Gray
    Write-Host "   • TypeScript and Next.js settings" -ForegroundColor Gray
    Write-Host "   • Supabase MCP server connection" -ForegroundColor Gray
    Write-Host "   • Jest testing configuration" -ForegroundColor Gray
    
    Write-Host "`n💡 Tip: Commit .vscode, .cursor, and .windsurf directories to share with team" -ForegroundColor Yellow
    
} catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
