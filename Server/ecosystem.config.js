module.exports = {
  apps: [
    {
      name: "admeasy-backend",
      script: "index.js",
      cwd: "./",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "admeasy-worker",
      script: "worker/email.worker.js",
      cwd: "./",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};