module.exports = {
    apps: [
        {
            name: "chat-service", // Name of the application
            script: 'npm', // './dist/main.js',
            cwd: '/usr/src/chat-service',
            args: "run start:prod", // This explicitly uses the npm script
            instances: 'max', // Max instances based on available CPU cores
            exec_mode: 'cluster', // Enable cluster mode for multi-core CPUs
            watch: false, // Disable watching in production
            autorestart: true, // Restart app automatically if it crashes
            max_memory_restart: "512M", // Restart if memory exceeds 200MB
            env: {
                NODE_ENV: "prod", // Environment variable for production
                PORT: 3000,
                NODE_OPTIONS: '--max-old-space-size=512',
                // DATABASE_URL: 'postgres://user:password@postgres:5432/chat_db', // Adjust this based on your setup
                // REDIS_URL: 'redis://localhost:6379', // If Redis is added
            },
            env_local: {
                NODE_ENV: "local",
            },
            env_dev: {
                NODE_ENV: "dev",
            },
            env_debug: {
                NODE_ENV: "debug",
            },
        },
    ],
};
