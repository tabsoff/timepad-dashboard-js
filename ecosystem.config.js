module.exports = {
  apps: [
    {
      name: "timepad-dashboard",
      script: "./server.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      max_memory_restart: "300M",
      exp_backoff_restart_delay: 100,
    },
  ],
};
