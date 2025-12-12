#!/usr/bin/env pwsh
# ==========================================
# ADVANCIA AI WORKSPACE VERIFICATION
# ==========================================
# This script verifies the complete VS Code workspace setup
# for AI-powered SaaS development with all required extensions
# and configurations.

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔍 ADVANCIA AI WORKSPACE VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$passed = 0
$failed = 0
$warnings = 0

# ==========================================
# 1. VERIFY VS CODE INSTALLED
# ==========================================
Write-Host "1️⃣ Checking VS Code Installation..." -ForegroundColor Yellow
try {
    $codeVersion = code --version 2>&1 | Select-Object -First 1
    if ($codeVersion) {
        Write-Host "   ✅ VS Code installed: $codeVersion" -ForegroundColor Green
        $passed++
    }
} catch {
    Write-Host "   ❌ VS Code not found in PATH" -ForegroundColor Red
    Write-Host "      Install from: https://code.visualstudio.com/" -ForegroundColor Yellow
    $failed++
}
Write-Host ""

# ==========================================
# 2. VERIFY WORKSPACE FILES
# ==========================================
Write-Host "2️⃣ Verifying Workspace Configuration Files..." -ForegroundColor Yellow
$requiredFiles = @(
    ".vscode/extensions.json",
    ".vscode/settings.json",
    "EXTENSIONS_INSTALL_GUIDE.md",
    "backend/.env",
    "backend/prisma/schema.prisma",
    "backend/src/index.ts",
    "backend/src/ai/copilot/CopilotService.ts",
    "frontend/next.config.js"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   ❌ Missing: $file" -ForegroundColor Red
        $failed++
    }
}
Write-Host ""

# ==========================================
# 3. CHECK INSTALLED EXTENSIONS
# ==========================================
Write-Host "3️⃣ Checking Critical VS Code Extensions..." -ForegroundColor Yellow

$criticalExtensions = @(
    @{id="github.copilot"; name="GitHub Copilot"},
    @{id="github.copilot-chat"; name="GitHub Copilot Chat"},
    @{id="prisma.prisma"; name="Prisma"},
    @{id="ms-vscode.vscode-typescript-next"; name="TypeScript Nightly"},
    @{id="dbaeumer.vscode-eslint"; name="ESLint"},
    @{id="esbenp.prettier-vscode"; name="Prettier"},
    @{id="usernamehw.errorlens"; name="Error Lens"},
    @{id="humao.rest-client"; name="REST Client"},
    @{id="ms-azuretools.vscode-docker"; name="Docker"}
)

$installedExtensions = code --list-extensions 2>&1

foreach ($ext in $criticalExtensions) {
    if ($installedExtensions -contains $ext.id) {
        Write-Host "   ✅ $($ext.name)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   ⚠️  Not installed: $($ext.name)" -ForegroundColor Yellow
        Write-Host "      Install: code --install-extension $($ext.id)" -ForegroundColor DarkGray
        $warnings++
    }
}
Write-Host ""

# ==========================================
# 4. VERIFY ENVIRONMENT VARIABLES
# ==========================================
Write-Host "4️⃣ Checking Environment Variables..." -ForegroundColor Yellow

if (Test-Path "backend/.env") {
    $envContent = Get-Content "backend/.env" -Raw
    
    $requiredEnvVars = @(
        "DATABASE_URL",
        "JWT_SECRET",
        "EMAIL_USER",
        "EMAIL_PASSWORD",
        "SMTP_HOST",
        "SMTP_PORT",
        "COPILOT_ENABLED",
        "COPILOT_OPENAI_API_KEY",
        "COPILOT_MODEL",
        "COPILOT_TEMPERATURE",
        "COPILOT_MAX_TOKENS"
    )
    
    foreach ($var in $requiredEnvVars) {
        if ($envContent -match "$var\s*=") {
            Write-Host "   ✅ $var" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "   ❌ Missing: $var" -ForegroundColor Red
            $failed++
        }
    }
    
    # Check if OpenAI key is set (not placeholder)
    if ($envContent -match "COPILOT_OPENAI_API_KEY=\s*$|COPILOT_OPENAI_API_KEY=your-.*key.*") {
        Write-Host "   ⚠️  OPENAI_API_KEY needs to be set" -ForegroundColor Yellow
        Write-Host "      Get your key from: https://platform.openai.com/api-keys" -ForegroundColor DarkGray
        $warnings++
    }
} else {
    Write-Host "   ❌ backend/.env not found" -ForegroundColor Red
    $failed++
}
Write-Host ""

# ==========================================
# 5. CHECK NODE.JS & DEPENDENCIES
# ==========================================
Write-Host "5️⃣ Verifying Node.js & Dependencies..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version 2>&1
    Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "   ❌ Node.js not installed" -ForegroundColor Red
    $failed++
}

$directories = @("backend", "frontend")
foreach ($dir in $directories) {
    if (Test-Path "$dir/node_modules") {
        Write-Host "   ✅ $dir dependencies installed" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   ⚠️  $dir/node_modules missing - run: cd $dir && npm install" -ForegroundColor Yellow
        $warnings++
    }
}
Write-Host ""

# ==========================================
# 6. VERIFY AI AGENT FILES
# ==========================================
Write-Host "6️⃣ Checking AI Agent Implementation..." -ForegroundColor Yellow

$aiAgentFiles = @(
    "backend/src/ai/copilot/CopilotService.ts",
    "backend/src/ai/copilot/TaskGenerator.ts",
    "backend/src/ai/copilot/RAGEngine.ts",
    "backend/src/ai/copilot/FeedbackLearner.ts",
    "backend/src/routes/copilot.ts",
    "backend/prisma/schema.prisma"
)

foreach ($file in $aiAgentFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   ❌ Missing: $file" -ForegroundColor Red
        $failed++
    }
}

# Check for Copilot models in schema
if (Test-Path "backend/prisma/schema.prisma") {
    $schemaContent = Get-Content "backend/prisma/schema.prisma" -Raw
    $copilotModels = @("CopilotTask", "CopilotInteraction", "CopilotFeedback", "CodebaseIndex")
    
    foreach ($model in $copilotModels) {
        if ($schemaContent -match "model $model") {
            Write-Host "   ✅ Prisma model: $model" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "   ❌ Missing Prisma model: $model" -ForegroundColor Red
            $failed++
        }
    }
}
Write-Host ""

# ==========================================
# 7. TEST SERVER CONNECTIVITY
# ==========================================
Write-Host "7️⃣ Testing Backend Server..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/api/health" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Backend server is running (port 4000)" -ForegroundColor Green
        Write-Host "      Response: $($response.Content)" -ForegroundColor DarkGray
        $passed++
        
        # Parse response to check database
        $healthData = $response.Content | ConvertFrom-Json
        if ($healthData.database -eq "connected") {
            Write-Host "   ✅ Database connected" -ForegroundColor Green
            $passed++
        }
    }
} catch {
    Write-Host "   ⚠️  Backend server not running" -ForegroundColor Yellow
    Write-Host "      Start with: cd backend && npm run dev" -ForegroundColor DarkGray
    $warnings++
}
Write-Host ""

# ==========================================
# 8. CHECK GIT STATUS
# ==========================================
Write-Host "8️⃣ Checking Git Repository..." -ForegroundColor Yellow

try {
    $gitStatus = git status --porcelain 2>&1
    $gitBranch = git branch --show-current 2>&1
    
    Write-Host "   ✅ Git repository initialized" -ForegroundColor Green
    Write-Host "      Current branch: $gitBranch" -ForegroundColor DarkGray
    $passed++
    
    if ($gitStatus) {
        $changedFiles = ($gitStatus -split "`n").Count
        Write-Host "   ⚠️  $changedFiles uncommitted changes" -ForegroundColor Yellow
        $warnings++
    } else {
        Write-Host "   ✅ Working tree clean" -ForegroundColor Green
        $passed++
    }
} catch {
    Write-Host "   ❌ Git not initialized or not installed" -ForegroundColor Red
    $failed++
}
Write-Host ""

# ==========================================
# 9. VERIFY DOCUMENTATION
# ==========================================
Write-Host "9️⃣ Checking Documentation..." -ForegroundColor Yellow

$docFiles = @(
    "EXTENSIONS_INSTALL_GUIDE.md",
    "README.md",
    "backend/README.md",
    "frontend/README.md",
    ".github/copilot-instructions.md"
)

foreach ($doc in $docFiles) {
    if (Test-Path $doc) {
        Write-Host "   ✅ $doc" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   ⚠️  Missing: $doc" -ForegroundColor Yellow
        $warnings++
    }
}
Write-Host ""

# ==========================================
# FINAL SUMMARY
# ==========================================
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Passed:   $passed" -ForegroundColor Green
Write-Host "⚠️  Warnings: $warnings" -ForegroundColor Yellow
Write-Host "❌ Failed:   $failed" -ForegroundColor Red
Write-Host ""

$total = $passed + $warnings + $failed
$score = [math]::Round(($passed / $total) * 100, 1)

if ($failed -eq 0 -and $warnings -eq 0) {
    Write-Host "🎉 PERFECT SETUP! All checks passed!" -ForegroundColor Green
    Write-Host "   Workspace Score: 100% ⭐⭐⭐⭐⭐" -ForegroundColor Green
} elseif ($failed -eq 0) {
    Write-Host "✅ READY! Minor warnings but workspace is functional" -ForegroundColor Green
    Write-Host "   Workspace Score: $score% ($passed/$total)" -ForegroundColor Yellow
} elseif ($failed -le 3) {
    Write-Host "⚠️  INCOMPLETE - Some critical components missing" -ForegroundColor Yellow
    Write-Host "   Workspace Score: $score% ($passed/$total)" -ForegroundColor Yellow
} else {
    Write-Host "❌ SETUP REQUIRED - Multiple critical issues found" -ForegroundColor Red
    Write-Host "   Workspace Score: $score% ($passed/$total)" -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📚 NEXT STEPS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($warnings -gt 0) {
    Write-Host "📝 To install missing extensions:" -ForegroundColor Yellow
    Write-Host "   1. Open VS Code" -ForegroundColor White
    Write-Host "   2. Press Ctrl+Shift+P" -ForegroundColor White
    Write-Host "   3. Type 'Extensions: Show Recommended Extensions'" -ForegroundColor White
    Write-Host "   4. Click 'Install All' or run:" -ForegroundColor White
    Write-Host "      See EXTENSIONS_INSTALL_GUIDE.md for commands" -ForegroundColor DarkGray
    Write-Host ""
}

if ($envContent -match "COPILOT_OPENAI_API_KEY=\s*$|COPILOT_OPENAI_API_KEY=your-.*key.*") {
    Write-Host "🔑 To enable AI Copilot:" -ForegroundColor Yellow
    Write-Host "   1. Get OpenAI API key: https://platform.openai.com/api-keys" -ForegroundColor White
    Write-Host "   2. Add to backend/.env: COPILOT_OPENAI_API_KEY=sk-proj-..." -ForegroundColor White
    Write-Host "   3. Restart backend server" -ForegroundColor White
    Write-Host ""
}

Write-Host "🚀 To start development servers:" -ForegroundColor Cyan
Write-Host "   Backend:  cd backend && npm run dev" -ForegroundColor White
Write-Host "   Frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📖 Full setup guide: EXTENSIONS_INSTALL_GUIDE.md" -ForegroundColor Cyan
Write-Host "🏠 Workspace ready for AI-powered SaaS development!" -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
