@echo off
echo 🚀 Committing Vercel warning fixes...
echo.

echo 📝 Adding all changes...
git add .
echo.

echo 💾 Committing changes...
git commit -m "fix: resolve Vercel warnings - update config and add type definitions"
echo.

echo 📤 Pushing to branch...
git push origin copilot/vscode1762097186579
echo.

echo ✅ All done! Check your Vercel dashboard for auto-deployment.
echo.
echo 📋 Next steps:
echo 1. Go to https://vercel.com/dashboard
echo 2. Check deployment status and warning count
echo 3. Set environment variables if needed
echo 4. Test the application
echo.
pause