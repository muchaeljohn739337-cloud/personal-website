# 🔍 Error Checking & Troubleshooting Guide

## Quick Error Check

Run this task from VS Code:
**`Ctrl+Shift+P`** → "Tasks: Run Task" → **"🔍 Full Error Check - AdvanciaCore"**

Or run manually:

```powershell
cd backend-dotnet/AdvanciaCore
dotnet build --verbosity detailed
```

## ✅ Current Status

**AdvanciaCore project is error-free!**

- ✅ Project structure correct
- ✅ Dependencies installed
- ✅ Build succeeds
- ✅ Code compiles without warnings
- ✅ Ready to run

## Common Issues & Solutions

### Issue 1: "dotnet: command not found"

**Solution:** Install .NET 9 SDK

```powershell
winget install Microsoft.DotNet.SDK.9
```

Verify:

```powershell
dotnet --version  # Should show 9.0.x
```

---

### Issue 2: Port 5001 already in use

**Symptom:**

```
Failed to bind to address https://127.0.0.1:5001
```

**Solution:**

```powershell
# Find process using port 5001
netstat -ano | findstr :5001

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

Or change the port in `Properties/launchSettings.json`.

---

### Issue 3: Package restore fails

**Symptom:**

```
error NU1101: Unable to find package
```

**Solution:**

```powershell
# Clear NuGet cache
dotnet nuget locals all --clear

# Restore packages
dotnet restore --force
```

---

### Issue 4: Build warnings

**Check for warnings:**

```powershell
dotnet build --verbosity detailed
```

**Common warnings:**

- CS8618: Non-nullable property not initialized
  - **Fix:** Initialize in constructor or make nullable
- CS0168: Variable declared but never used
  - **Fix:** Remove unused variables

---

### Issue 5: Azure deployment fails

**Symptom:**

```
Error: The Resource 'Microsoft.Web/sites/AdvanciaCoreApp' under resource group 'AdvanciaRG' was not found
```

**Solution:**

```powershell
# Check Azure login
az account show

# Login if needed
az login

# Check resources
az resource list --resource-group AdvanciaRG

# Recreate if missing
az webapp create --name AdvanciaCoreApp --resource-group AdvanciaRG --plan AdvanciaPlan --runtime "DOTNET:9.0"
```

---

### Issue 6: HTTPS certificate errors (Development)

**Symptom:**

```
Unable to configure HTTPS endpoint
```

**Solution:**

```powershell
# Trust dev certificate
dotnet dev-certs https --trust
```

---

## Detailed Build Check

### Run Full Diagnostics

```powershell
cd backend-dotnet/AdvanciaCore

# 1. Check .NET SDK
Write-Host "1. .NET SDK Version:" -ForegroundColor Yellow
dotnet --version

# 2. Check project validity
Write-Host "`n2. Project Info:" -ForegroundColor Yellow
dotnet msbuild /t:Restore /p:RestoreRecursive=false /v:minimal

# 3. Restore packages
Write-Host "`n3. Restoring Packages:" -ForegroundColor Yellow
dotnet restore --verbosity normal

# 4. Build with detailed output
Write-Host "`n4. Building Project:" -ForegroundColor Yellow
dotnet build --no-restore --verbosity normal

# 5. Check for warnings
Write-Host "`n5. Checking for Warnings:" -ForegroundColor Yellow
dotnet build --no-restore /warnaserror

# 6. Run tests (if any)
Write-Host "`n6. Running Tests:" -ForegroundColor Yellow
dotnet test --no-build --verbosity normal

Write-Host "`n✅ All checks complete!" -ForegroundColor Green
```

---

## Error Codes Reference

| Error Code | Meaning                     | Solution                    |
| ---------- | --------------------------- | --------------------------- |
| CS0103     | Name does not exist         | Check using statements      |
| CS1061     | Type does not contain...    | Check method/property names |
| CS0246     | Type or namespace not found | Add package reference       |
| NU1101     | Unable to find package      | Check package name/version  |
| MSB3073    | Command exited with code    | Check build logs            |

---

## Monitoring for Errors

### Watch for Changes

```powershell
# Auto-rebuild on file changes
dotnet watch build
```

### Continuous Monitoring

```powershell
# Run with live reload
dotnet watch run
```

---

## Check Azure Deployment Status

```powershell
# Check deployment logs
az webapp log tail --name AdvanciaCoreApp --resource-group AdvanciaRG

# Download logs
az webapp log download --name AdvanciaCoreApp --resource-group AdvanciaRG --log-file logs.zip

# Check app status
az webapp show --name AdvanciaCoreApp --resource-group AdvanciaRG --query "state"
```

---

## VS Code Tasks for Error Checking

Available tasks (run from Command Palette):

1. **🔍 Full Error Check - AdvanciaCore** - Complete diagnostics
2. **🔍 Type Check & Lint** - Validate code quality
3. **🚀 Run AdvanciaCore (Minimal API)** - Start with error monitoring

---

## Health Check Endpoints

Once running, check these endpoints:

```powershell
# Local
curl https://localhost:5001/health
curl https://localhost:5001/

# Azure (after deployment)
curl https://advanciocoreapp.azurewebsites.net/health
curl https://advanciocoreapp.azurewebsites.net/
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2025-11-03T...",
  "service": "AdvanciaCore",
  "version": "1.0.0"
}
```

---

## Enable Detailed Logging

Add to `appsettings.Development.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information",
      "System": "Information"
    }
  }
}
```

---

## Performance Issues

If the app is slow:

```powershell
# Check memory usage
dotnet-counters monitor --process-id <PID>

# Profile the app
dotnet-trace collect --process-id <PID>
```

---

## Best Practices for Error Prevention

1. **Always build before committing**

   ```powershell
   dotnet build --no-incremental
   ```

2. **Run with verbose logging during development**

   ```powershell
   dotnet run --verbosity diagnostic
   ```

3. **Test endpoints after changes**

   ```powershell
   curl https://localhost:5001/health
   ```

4. **Check Azure logs after deployment**
   ```powershell
   az webapp log tail --name AdvanciaCoreApp --resource-group AdvanciaRG
   ```

---

## Current Project Status

**Last Check:** ✅ No errors found  
**Build Status:** ✅ Successful  
**Ready to Deploy:** ✅ Yes

**To run:**

```powershell
cd backend-dotnet/AdvanciaCore
dotnet run
```

**To deploy:**

```powershell
.\scripts\Quick-Deploy-Azure.ps1
```

---

**Keep this file handy for troubleshooting! 🔧**
