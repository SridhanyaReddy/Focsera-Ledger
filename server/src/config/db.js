import mongoose from 'mongoose';

let cachedConn = null;
let cachedPromise = null;
let mongoMemoryServer = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    if (cachedConn) {
      return cachedConn;
    }

    if (!cachedPromise) {
      const opts = {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 45000,
      };
      cachedPromise = mongoose.connect(uri, opts).then((mongooseInstance) => {
        return mongooseInstance;
      });
    }

    try {
      cachedConn = await cachedPromise;
      return cachedConn;
    } catch (e) {
      cachedPromise = null;
      throw e;
    }
  }

  // Fallback to in-memory MongoDB instance for local dev & testing without external dependencies
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`Connected to Embedded/Memory MongoDB instance: ${memoryUri}`);
    return conn;
  } catch (err) {
    console.error(`Failed to initialize in-memory database: ${err.message}`);
    throw err;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
}

