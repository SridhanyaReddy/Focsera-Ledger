import mongoose from 'mongoose';

let mongoMemoryServer = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    console.log('Connecting to MongoDB Atlas / configured URI...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`Connected to MongoDB Atlas / Database: ${conn.connection.host}`);
    return conn;
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

