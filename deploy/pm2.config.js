module.exports = {
  apps: [
    {
      name: "app-platform",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/app-platform",
      instances: "max", // use all CPU cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "1G",
      error_file: "/var/log/app-platform/error.log",
      out_file: "/var/log/app-platform/out.log",
      log_file: "/var/log/app-platform/combined.log",
      time: true,
    },
  ],
};
