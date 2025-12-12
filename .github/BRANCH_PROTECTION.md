# Branch Protection Setup Guide

## 🔒 Protecting the Main Branch

This guide explains how to set up branch protection for the `main` branch to prevent accidental pushes and ensure code quality.

## 🚀 Quick Setup (Automated)

### Using GitHub CLI

```bash
# Install GitHub CLI (if not installed)
winget install --id GitHub.cli

# Authenticate
gh auth login

# Run the setup script
pwsh scripts/setup-branch-protection.ps1
```

## 📋 Manual Setup

### Step 1: Navigate to Branch Settings

1. Go to: https://github.com/muchaeljohn739337-cloud/personal-website/settings/branches
2. Under "Branch protection rules", click **"Add rule"** or edit the existing `main` rule

### Step 2: Configure Protection Rules

#### Basic Settings

- **Branch name pattern**: `main`
- **Require a pull request before merging**
  - ✅ Require approvals: `1`
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners: (optional)

#### Additional Settings

- ✅ **Require status checks to pass before merging**
  - Add status checks: `build`, `test`, `lint` (if you have CI/CD)
  
- ✅ **Require conversation resolution before merging**
  - All comments must be resolved

- ✅ **Require linear history**
  - Prevents merge commits (optional, for cleaner history)

- ✅ **Require signed commits** (optional)
  - Ensures all commits are signed

- ❌ **Do not allow bypassing the above settings**
  - Even admins must follow these rules

- ❌ **Do not allow force pushes**
  - Prevents `git push --force`

- ❌ **Do not allow deletions**
  - Prevents accidental branch deletion

### Step 3: Save

Click **"Create"** or **"Save changes"** to apply the protection rules.

## ✅ Recommended Protection Rules

```yaml
Branch: main
Protection Rules:
  - Require pull request reviews: 1 approval
  - Require status checks: build, test, lint
  - Require conversation resolution: Yes
  - Require linear history: Optional
  - Allow force pushes: No
  - Allow deletions: No
  - Enforce for admins: Yes (recommended)
```

## 🔍 Verify Protection

After setting up, verify protection is active:

```bash
# Check protection status via GitHub CLI
gh api repos/muchaeljohn739337-cloud/personal-website/branches/main/protection
```

Or visit: https://github.com/muchaeljohn739337-cloud/personal-website/branches

## 🛡️ What This Protects Against

1. **Direct pushes to main** - All changes must go through pull requests
2. **Unreviewed code** - At least 1 approval required
3. **Force pushes** - Prevents history rewriting
4. **Branch deletion** - Prevents accidental deletion
5. **Unresolved conversations** - All PR comments must be addressed

## 📝 Workflow After Protection

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/my-feature
   ```

3. Create a Pull Request on GitHub

4. Get approval from a reviewer

5. Merge the PR (this will merge into main)

### Emergency Fixes

If you need to push directly to main in an emergency:

1. Temporarily disable protection (not recommended)
2. Or use GitHub's "Allow edits by maintainers" feature
3. Or create a hotfix branch and fast-track the PR

## 🔧 Troubleshooting

### "Cannot push to protected branch"

This means protection is working! You need to:
1. Create a feature branch
2. Push to that branch
3. Create a Pull Request
4. Get approval
5. Merge via GitHub

### "Required status check is pending"

Make sure your CI/CD workflows are running. Check:
- GitHub Actions are enabled
- Workflows are passing
- Status checks are configured correctly

## 📚 Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub CLI Documentation](https://cli.github.com/manual/)

---

**Status**: ✅ Branch protection recommended for production repositories
