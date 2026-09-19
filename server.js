const app = require('./src/app');
const env = require('./src/config/env');

app.listen(env.port, () => {
  console.log(`VJU Tech Web Platform server running on http://localhost:${env.port}`);
});