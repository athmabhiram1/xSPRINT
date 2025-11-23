module.exports = {
    apps: [
        {
            name: 'xsprint-backend',
            script: 'dist/index.js',
            instances: 2,
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
            },
            env_development: {
                NODE_ENV: 'development',
                PORT: 3001,
            },
            error_file: './logs/err.log',
            out_file: './logs/out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            exp_backoff_restart_delay: 100,
        },
    ],
};
