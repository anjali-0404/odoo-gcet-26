import mongoose from 'mongoose';

const STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

export async function connectDB(uri) {
  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const { host, name } = mongoose.connection;
  console.log(`[db] MongoDB connected: ${host}/${name}`);

  mongoose.connection.on('disconnected', () => console.warn('[db] MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => console.log('[db] MongoDB reconnected'));
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.connection.close();
}

export function getDBState() {
  return STATES[mongoose.connection.readyState] ?? 'unknown';
}
