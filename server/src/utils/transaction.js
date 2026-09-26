import mongoose from 'mongoose';

/**
 * Runs `fn(session)` inside a MongoDB transaction. Everything that changes stock
 * must pass `session` to every query so all writes commit or roll back together.
 * withTransaction retries on transient errors (e.g. write conflicts), so `fn`
 * must re-read whatever it needs from the database instead of relying on state
 * captured outside.
 */
export async function runInTransaction(fn) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
