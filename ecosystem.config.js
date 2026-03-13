// PM2 process manager configuration for VPS hosting
// Usage:
//   pm2 start ecosystem.config.js          # start
//   pm2 restart ecosystem.config.js        # restart
//   pm2 stop ecomcreatives                 # stop
//   pm2 logs ecomcreatives                 # view logs
//   pm2 save && pm2 startup                # auto-start on reboot

module.exports = {
  apps: [
    {
      name: "ecomcreatives",
      script: "node_modules/.bin/next",
      args: "start",

      // Number of CPU cores to use (use "max" to use all cores)
      instances: 1,
      exec_mode: "fork", // use "cluster" if instances > 1

      // Working directory (adjust to your actual deployment path)
      cwd: "/var/www/ecomcreatives",

      // Environment variables for production
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      // Logging
      out_file: "/var/log/ecomcreatives/out.log",
      error_file: "/var/log/ecomcreatives/error.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Restart policy
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",

      // Wait 3 seconds before considering the app started
      wait_ready: false,
      listen_timeout: 10000,
    },
  ],
};
