# Auto-generated Vercel Environment Variables Setup Script (PowerShell)
# Run this script to set all environment variables in Vercel

Write-Host "🔧 Setting Vercel Environment Variables..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Setting DATABASE_URL..." -ForegroundColor Yellow
""Pi6icDrern3Kdszg"" | npx vercel env add DATABASE_URL production
Write-Host ""
Write-Host "Setting JWT_SECRET..." -ForegroundColor Yellow
""a7ed1bc7a946c2bd00e0b9f08f228f719b64996dee20b4e1118e613e73e15363c6dc9d22913c60213a2a3f514988c7873035f1ff0459ef79634799b2c2cbc91c"" | npx vercel env add JWT_SECRET production
Write-Host ""
Write-Host "Setting SESSION_SECRET..." -ForegroundColor Yellow
""8bfcab32fd65100e6fae942945b994ba08299b1aa12f92146ddcfc789d49d3454405df3e190330d0ad6caddf45375b12f3ef0acff67b64d83896e75b47d2520b"" | npx vercel env add SESSION_SECRET production
Write-Host ""
Write-Host "Setting NEXTAUTH_SECRET..." -ForegroundColor Yellow
""QIBhNTm4lb3OLBJHNx7fRkCeCvTsjpfrQNvduoO5aWI=\n"" | npx vercel env add NEXTAUTH_SECRET production
Write-Host ""
Write-Host "Setting NEXT_PUBLIC_APP_URL..." -ForegroundColor Yellow
""https://advanciapayledger.com"" | npx vercel env add NEXT_PUBLIC_APP_URL production
Write-Host ""
Write-Host "Setting NEXTAUTH_URL..." -ForegroundColor Yellow
""https://personal-website-4puis47cl-advanciapayledger.vercel.app\r\n"" | npx vercel env add NEXTAUTH_URL production
Write-Host ""
Write-Host "Setting NEXT_PUBLIC_SUPABASE_URL..." -ForegroundColor Yellow
""https://xesecqcqzykvmrtxrzqi.supabase.c"" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
Write-Host ""
Write-Host "Setting NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY..." -ForegroundColor Yellow
""sb_publishable_dj1xLuksqBUvn9O6AWU3Fg_bRYa6ohq"" | npx vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY production
Write-Host ""
Write-Host "Setting DIRECT_URL..." -ForegroundColor Yellow
""Pi6icDrern3Kdszg\n"" | npx vercel env add DIRECT_URL production
Write-Host ""


Write-Host "✅ All variables set!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run deploy:prod:safe"
Write-Host "2. Run: npm run post-deploy"
