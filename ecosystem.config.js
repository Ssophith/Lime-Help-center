/**
 * PM2 Ecosystem Configuration for Production
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'limekb',
      script: 'npm',
      args: 'start',
      cwd: '/home/admin/limekb',
      instances: 1, // Start with 1 instance (can increase later)
      exec_mode: 'fork', // Use fork mode instead of cluster for single instance
      env: {
        NODE_ENV: 'production',
        PORT: 3010,
        // DATABASE_URL and other secrets are loaded from .env.production via env_file below.
        // Do NOT add credentials here — this file is tracked in git.
      },
      // Logging
      error_file: '/home/admin/limekb/logs/pm2-error.log',
      out_file: '/home/admin/limekb/logs/pm2-out.log',
      log_file: '/home/admin/limekb/logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      
      // Watch (disabled in production)
      watch: false,
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Environment file (PM2 will load this, Next.js will also load .env.production automatically)
      env_file: '/home/admin/limekb/.env.production',
      
      // Source environment variables from file
      // Next.js automatically loads .env.production when NODE_ENV=production
      // This ensures PM2 also has access to them
      source_map_support: true,
    },
  ],
};
