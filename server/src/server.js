import env from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import app from './app.js';

async function start() {
  try {
    await connectDB(env.mongodbUri);
  } catch (err) {
    console.error(`[db] Could not connect to MongoDB: ${err.message}`);
    console.error('     Check MONGODB_URI in server/.env and that your IP is allowed in Atlas -> Network Access.');
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`[server] StockSense API listening on http://localhost:${env.port}/api (${env.nodeEnv})`);
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (err) => {
  console.error('[server] Unhandled promise rejection:', err);
});

start();
