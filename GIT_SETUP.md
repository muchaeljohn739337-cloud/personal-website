# Git Setup Guide - Senior Engineer Workflow

## 🚀 Quick Setup

### 1. Create GitHub Repository

```bash
# Go to GitHub and create a new repository named 'personal-website'
# Then run these commands:

git add .
git commit -m "Initial commit: Portfolio website setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/personal-website.git
git push -u origin main
```

### 2. Create Develop Branch

```bash
git checkout -b develop
git push -u origin develop
```

### 3. Set Up Branch Protection (GitHub Web UI)

1. Go to: `Settings` → `Branches` → `Add rule`
2. For **main** branch:
   - ✅ Require pull request reviews (1 approval)
   - ✅ Require status checks: `lint-and-type-check`, `build`, `security-scan`
   - ✅ Require branches to be up to date
   - ✅ Require conversation resolution
   - ✅ Restrict pushes (admins only)
   - ❌ Disable force pushes
   - ❌ Disable deletions

3. For **develop** branch:
   - ✅ Require pull request reviews (1 approval)
   - ✅ Require status checks: `lint-and-type-check`, `build`
   - ✅ Require branches to be up to date

### 4. Configure GitHub Actions Secrets (Optional)

For deployment tracking script:

- Go to: `Settings` → `Secrets and variables` → `Actions`
- Add: `GITHUB_TOKEN` (auto-provided by GitHub Actions)

## 📋 Daily Workflow

### Creating a Feature

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push -u origin feature/your-feature-name
```

### Creating a Pull Request

1. Go to GitHub repository
2. Click "Compare & pull request"
3. Set base branch to `develop`
4. Fill in PR description
5. Wait for automated checks to pass
6. Request review
7. Merge after approval

### Merging to Production

```bash
# Create PR from develop to main
# This requires approval and all checks must pass
# After merge, GitHub Actions will run deployment
```

## 🔍 Monitoring & Cleanup

### Check Deployment Status

```bash
npm run check:deploy
```

This script shows:

- ✅ Successful deployments
- ❌ Failed deployments (with IDs for cleanup)
- ⏳ In-progress deployments
- 🌿 Stale branches (>30 days old)

### Delete Failed Workflow Runs

```bash
# Using GitHub CLI
gh run delete <run-id>

# Or delete all failed runs
gh run list --status failure --json databaseId -q '.[].databaseId' | xargs -I {} gh run delete {}
```

### Clean Up Merged Branches

```bash
# Delete local branch
git branch -d feature/your-feature

# Delete remote branch
git push origin --delete feature/your-feature

# Prune deleted remote branches
git fetch --prune
```

### Automated Cleanup

The `.github/workflows/cleanup.yml` runs daily at 2 AM UTC:

- Deletes build artifacts older than 7 days
- Deletes workflow runs older than 30 days

Manual trigger:

1. Go to `Actions` tab
2. Select "Cleanup Failed Deployments"
3. Click "Run workflow"

## 🛠️ VS Code Integration

### Recommended Extensions

Install these extensions (already configured in `.vscode/extensions.json`):

- **GitLens** - Enhanced Git visualization
- **Git Graph** - Visual branch history
- **GitHub Pull Requests** - Manage PRs in VS Code

### Git Settings

The `.vscode/settings.json` configures:

- Auto-fetch from remote every 3 minutes
- Auto-stash before pull/rebase
- Rebase instead of merge on pull
- Branch protection warnings for `main` and `develop`

## 📊 Automated Checks

Every push/PR triggers:

1. **Lint & Type Check**
   - ESLint validation
   - TypeScript type checking

2. **Build**
   - Next.js production build
   - Artifacts saved for 7 days

3. **Security Scan**
   - npm audit for vulnerabilities
   - Continues even if moderate issues found

## 🔐 Security Best Practices

- ✅ Never commit `.env` files
- ✅ Use GitHub Secrets for sensitive data
- ✅ Keep dependencies updated
- ✅ Review security audit results
- ✅ Require code reviews before merge

## 📝 Commit Message Convention

```bash
feat: add new feature
fix: resolve bug
docs: update documentation
style: format code
refactor: restructure code
test: add tests
chore: update dependencies
```

## 🆘 Troubleshooting

### Failed CI Checks

```bash
# Run checks locally before pushing
npm run lint
npm run build
npm audit
```

### Merge Conflicts

```bash
# Update your branch with latest develop
git checkout develop
git pull origin develop
git checkout feature/your-feature
git rebase develop

# Resolve conflicts, then:
git add .
git rebase --continue
git push --force-with-lease
```

### Accidentally Pushed to Protected Branch

Protected branches prevent direct pushes. If you need to revert:

```bash
# Create a revert PR
git checkout main
git pull origin main
git revert <commit-hash>
git push origin main
```

## 📚 Additional Resources

- [Branch Protection Documentation](.github/BRANCH_PROTECTION.md)
- [GitHub Actions Workflows](.github/workflows/)
- [Deployment Check Script](scripts/check-deployment.js)
