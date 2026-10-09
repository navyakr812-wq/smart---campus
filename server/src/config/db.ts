import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  const mongoUri = process.env.MONGO_URI;

  if (isProduction) {
    if (!mongoUri) {
      console.error('[DB FATAL ERROR] MONGO_URI is not defined in production environment.');
      console.error('[DB FATAL ERROR] Please configure MONGO_URI (e.g., MongoDB Atlas connection string) in your Render environment variables.');
      process.exit(1);
    }

    try {
      console.log('[DB] Connecting to production MongoDB cluster...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log('[DB] Successfully connected to production MongoDB.');
    } catch (err: any) {
      console.error('[DB FATAL ERROR] Failed to connect to MongoDB in production:');
      console.error(err.message || err);
      console.error('[DB TIP] Verify Network Access in MongoDB Atlas allows 0.0.0.0/0 for Render.');
      process.exit(1);
    }
    return;
  }

  // Development environment
  if (mongoUri) {
    try {
      console.log('[DB DEV] Attempting to connect to configured MONGO_URI...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('[DB DEV] Connected to configured MongoDB URI.');
      return;
    } catch (err: any) {
      console.warn('[DB DEV] Could not connect to configured MONGO_URI:', err.message);
      console.warn('[DB DEV] Falling back to dev-only in-memory MongoDB server...');
    }
  }

  // Dev-only in-memory fallback
  try {
    console.log('[DB DEV] Initializing in-memory MongoDB server for zero-friction local development...');
    // Dynamic import to avoid bundling in production
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`[DB DEV] Connected to in-memory MongoDB at ${uri}`);
  } catch (err: any) {
    console.error('[DB DEV ERROR] Failed to start in-memory MongoDB fallback:', err);
    throw err;
  }
}
