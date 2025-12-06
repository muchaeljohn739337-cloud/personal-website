# Branch Protection Setup Guide

## Overview
This document outlines the branch protection rules for senior-level Git workflow management.

## Protected Branches

### `main` Branch (Production)
**Protection Rules:**
- ✅ Require pull request reviews before merging (1 approval minimum)
- ✅ Require status checks to pass before merging
  - `lint-and-type-check`
  - `build`
  - `security-scan`
- ✅ Require branches to be up to date before merging
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings
- ✅ Restrict who can push to matching branches (admins only)
- ✅ Require linear history (no merge commits)
- ❌ Allow force pushes: Disabled
- ❌ Allow deletions: Disabled

### `develop` Branch (Staging)
**Protection Rules:**
- ✅ Require pull request reviews before merging (1 approval)
- ✅ Require status checks to pass before merging
  - `lint-and-type-check`
  - `build`
- ✅ Require branches to be up to date before merging
- ✅ Allow force pushes (for rebasing)
- ❌ Allow deletions: Disabled

## Branch Strategy

```
main (production)
  ↑
  PR with reviews
  ↑
develop (staging)
  ↑
  PR
  ↑
feature/* (feature branches)
bugfix/* (bug fixes)
hotfix/* (emergency fixes)
```

## Setting Up in GitHub

1. **Navigate to Repository Settings**
   - Go to your GitHub repository
   - Click `Settings` → `Branches`

2. **Add Branch Protection Rule for `main`**
   - Click "Add rule"
   - Branch name pattern: `main`
   - Enable all checkboxes as listed above
   - Save changes

3. **Add Branch Protection Rule for `develop`**
   - Click "Add rule"
   - Branch name pattern: `develop`
   - Enable checkboxes as listed above
   - Save changes

## Automated Checks

All pull requests automatically run:
- **Linting**: ESLint checks code quality
- **Type Checking**: TypeScript validation
- **Build**: Ensures code compiles successfully
- **Security Audit**: npm audit for vulnerabilities

## Deployment Tracking

Failed deployments are automatically cleaned up:
- Build artifacts older than 7 days are deleted
- Workflow runs older than 30 days are deleted
- Manual cleanup can be triggered via Actions tab

## Workflow Commands

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Push and create PR
git push -u origin feature/your-feature-name

# Update from develop
git checkout develop
git pull origin develop
git checkout feature/your-feature-name
git rebase develop

# Delete merged branches locally
git branch -d feature/your-feature-name

# Delete remote branch (after PR merge)
git push origin --delete feature/your-feature-name
```

## VS Code Integration

The `.vscode/settings.json` file configures:
- Auto-fetch from remote
- Rebase on pull
- Auto-stash before operations
- Commit message validation
