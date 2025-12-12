# PowerShell script to commit and deploy Vercel fixes
Write-Host "🚀 Committing Vercel warning fixes..." -ForegroundColor Green
Write-Host ""

Write-Host "📝 Adding all changes..." -ForegroundColor Yellow
git add .
Write-Host ""

Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "fix: resolve Vercel warnings - update config and add type definitions"
Write-Host ""

Write-Host "📤 Pushing to branch..." -ForegroundColor Yellow
git push origin copilot/vscode1762097186579
Write-Host ""

Write-Host "✅ All done! Check your Vercel dashboard for auto-deployment." -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Check deployment status and warning count" -ForegroundColor White
Write-Host "3. Set environment variables if needed" -ForegroundColor White
Write-Host "4. Test the application" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"