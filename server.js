const app = require('./src/app');
const env = require('./src/config/env');
const initializeDatabase = require('./src/database/initialize');

initializeDatabase()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`VJU Tech Web Platform server running on http://localhost:${env.port}`);
    });
  })
  .catch((error) => {
    console.error('Database initialization failed:', error.message);
    process.exitCode = 1;
  });