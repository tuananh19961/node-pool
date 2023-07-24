module.exports = {
  apps : [{
    name: 'node-pool', // application name 
    script: 'app.js', // script path to pm2 start
    instances: 1, // number process of application
    autorestart: true, //auto restart if app crashes
    watch: false,
    max_memory_restart: '1G', // restart if it exceeds the amount of memory specified
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }],
};
