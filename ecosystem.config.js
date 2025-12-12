// PM2 Ecosystem Configuration for Advancia Platform + Status Monitoring
// Usage: pm2 start ecosystem.config.js
// Save: pm2 save
// Startup: pm2 startup

module.exports = {
  apps: [
    // =============================================
    // BACKEND API SERVER
    // =============================================
    {
      name: "advancia-backend",
      script: "backend/dist/index.js",
      cwd: process.cwd(),
      instances: 1,
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      kill_timeout: 5000,
      listen_timeout: 10000,
      restart_delay: 4000,
    },

    // =============================================
    // FRONTEND NEXT.JS APP
    // =============================================
    {
      name: "advancia-frontend",
      script: "npm",
      args: "run start",
      cwd: "./frontend",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      kill_timeout: 5000,
      restart_delay: 4000,
    },

    // =============================================
    // WATCHDOG HEALTH MONITOR (Runs every 2 minutes)
    // =============================================
    {
      name: "advancia-watchdog",
      script: "pwsh",
      args: "-NoProfile -ExecutionPolicy Bypass -File ./status-page/scripts/watchdog.ps1",
      cwd: process.cwd(),
      cron_restart: "*/2 * * * *", // Every 2 minutes
      autorestart: false, // Don't restart on exit (cron handles it)
      watch: false,
      log_file: "./logs/watchdog.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      max_memory_restart: "100M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],

  // =============================================
  // DEPLOYMENT CONFIGURATION
  // =============================================
  deploy: {
    production: {
      user: "deploy",
      host: ["your-server-ip"],
      ref: "origin/main",
      repo: "git@github.com:muchaeljohn739337-cloud/modular-saas-platform.git",
      path: "/var/www/advancia",
      "pre-deploy-local": "",
      "post-deploy":
        "npm install && cd backend && npm install && npm run build && cd ../frontend && npm install && npm run build && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
      env: {
        NODE_ENV: "production",
      },
    },
  },
};
