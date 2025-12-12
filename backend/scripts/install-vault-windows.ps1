# Install HashiCorp Vault on Windows
# This script downloads and sets up Vault for local development

$VaultVersion = "1.15.4"
$VaultZip = "vault_${VaultVersion}_windows_amd64.zip"
$VaultUrl = "https://releases.hashicorp.com/vault/${VaultVersion}/${VaultZip}"
$InstallDir = "$env:USERPROFILE\vault"
$VaultExe = "$InstallDir\vault.exe"

Write-Host "Installing HashiCorp Vault v${VaultVersion}..." -ForegroundColor Cyan

# Create installation directory
if (-not (Test-Path $InstallDir))
{
    New-Item -ItemType Directory -Path $InstallDir | Out-Null
}

# Download Vault
Write-Host "Downloading Vault from $VaultUrl..." -ForegroundColor Yellow
$ZipPath = "$InstallDir\$VaultZip"
try
{
    Invoke-WebRequest -Uri $VaultUrl -OutFile $ZipPath -UseBasicParsing
    Write-Host "Download complete" -ForegroundColor Green
}
catch
{
    Write-Host "Download failed: $_" -ForegroundColor Red
    exit 1
}

# Extract Vault
Write-Host "Extracting Vault..." -ForegroundColor Yellow
try
{
    Expand-Archive -Path $ZipPath -DestinationPath $InstallDir -Force
    Remove-Item $ZipPath
    Write-Host "Extraction complete" -ForegroundColor Green
}
catch
{
    Write-Host "Extraction failed: $_" -ForegroundColor Red
    exit 1
}

# Add to PATH
$CurrentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($CurrentPath -notlike "*$InstallDir*")
{
    Write-Host "Adding Vault to PATH..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("Path", "$CurrentPath;$InstallDir", "User")
    $env:Path = "$env:Path;$InstallDir"
    Write-Host "Vault added to PATH" -ForegroundColor Green
}
else
{
    Write-Host "Vault already in PATH" -ForegroundColor Green
}

# Verify installation
Write-Host ""
Write-Host "Verifying installation..." -ForegroundColor Yellow
& $VaultExe version

Write-Host ""
Write-Host "Vault installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start Vault server: vault server -dev -dev-root-token-id=hvs.dev-root-token" -ForegroundColor White
Write-Host "2. In new terminal: Set-Item -Path env:VAULT_ADDR -Value 'http://127.0.0.1:8200'" -ForegroundColor White
Write-Host "3. In new terminal: Set-Item -Path env:VAULT_TOKEN -Value 'hvs.dev-root-token'" -ForegroundColor White
Write-Host "4. Test: vault status" -ForegroundColor White
Write-Host ""
Write-Host "Note: Dev server is for DEVELOPMENT ONLY. Use production mode for real deployments." -ForegroundColor Yellow
