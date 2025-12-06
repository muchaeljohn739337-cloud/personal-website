#!/usr/bin/env node

/**
 * Deployment Status Checker
 * Checks GitHub Actions workflow status and provides cleanup recommendations
 */

const https = require('https');

// GitHub API base URL (used in makeRequest)
const REPO_OWNER = process.env.GITHUB_OWNER || 'your-username';
const REPO_NAME = process.env.GITHUB_REPO || 'personal-website';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js',
        Accept: 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        }),
      },
    };

    https
      .get(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

async function checkWorkflowRuns() {
  console.log(`${colors.blue}🔍 Checking workflow runs...${colors.reset}\n`);

  try {
    const runs = await makeRequest(`/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=20`);

    if (!runs.workflow_runs || runs.workflow_runs.length === 0) {
      console.log(`${colors.yellow}⚠️  No workflow runs found${colors.reset}`);
      return;
    }

    const stats = {
      success: 0,
      failure: 0,
      inProgress: 0,
      cancelled: 0,
    };

    const failedRuns = [];

    runs.workflow_runs.forEach((run) => {
      switch (run.conclusion) {
        case 'success':
          stats.success++;
          break;
        case 'failure':
          stats.failure++;
          failedRuns.push(run);
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
        case null:
          stats.inProgress++;
          break;
      }
    });

    // Display statistics
    console.log(`${colors.green}✅ Successful: ${stats.success}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${stats.failure}${colors.reset}`);
    console.log(`${colors.yellow}⏳ In Progress: ${stats.inProgress}${colors.reset}`);
    console.log(`${colors.gray}🚫 Cancelled: ${stats.cancelled}${colors.reset}\n`);

    // Show failed runs
    if (failedRuns.length > 0) {
      console.log(`${colors.red}Failed Deployments (can be deleted):${colors.reset}\n`);
      failedRuns.forEach((run) => {
        const date = new Date(run.created_at).toLocaleString();
        console.log(`  ${colors.red}•${colors.reset} ${run.name}`);
        console.log(`    ID: ${run.id}`);
        console.log(`    Branch: ${run.head_branch}`);
        console.log(`    Date: ${date}`);
        console.log(`    URL: ${run.html_url}\n`);
      });

      console.log(`${colors.yellow}💡 To delete failed runs, use:${colors.reset}`);
      console.log(`   gh run delete <run-id>\n`);
    }
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    if (error.message.includes('Not Found')) {
      console.log(
        `\n${colors.yellow}Tip: Update GITHUB_OWNER and GITHUB_REPO in the script${colors.reset}`
      );
    }
  }
}

async function checkBranches() {
  console.log(`${colors.blue}🌿 Checking branches...${colors.reset}\n`);

  try {
    const branches = await makeRequest(`/repos/${REPO_OWNER}/${REPO_NAME}/branches`);

    console.log(`${colors.green}Active branches: ${branches.length}${colors.reset}\n`);

    const staleBranches = [];
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    for (const branch of branches) {
      if (branch.name === 'main' || branch.name === 'develop') continue;

      const commit = await makeRequest(
        `/repos/${REPO_OWNER}/${REPO_NAME}/commits/${branch.commit.sha}`
      );
      const commitDate = new Date(commit.commit.author.date).getTime();

      if (commitDate < thirtyDaysAgo) {
        staleBranches.push({
          name: branch.name,
          lastCommit: commit.commit.author.date,
        });
      }
    }

    if (staleBranches.length > 0) {
      console.log(`${colors.yellow}⚠️  Stale branches (>30 days old):${colors.reset}\n`);
      staleBranches.forEach((branch) => {
        const date = new Date(branch.lastCommit).toLocaleDateString();
        console.log(`  ${colors.yellow}•${colors.reset} ${branch.name} (last commit: ${date})`);
      });
      console.log(`\n${colors.yellow}💡 To delete stale branches:${colors.reset}`);
      console.log(`   git push origin --delete <branch-name>\n`);
    } else {
      console.log(`${colors.green}✅ No stale branches found${colors.reset}\n`);
    }
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
  }
}

// Main execution
(async () => {
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}  Deployment Status & Cleanup Report${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

  await checkWorkflowRuns();
  await checkBranches();

  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);
})();
