import app from '../server/src/server.js';
import { connectDB } from '../server/src/config/db.js';

let isConnected = false;

export default async function handler(req, res) {
  try {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
    }
    return app(req, res);
  } catch (error) {
    console.error('Serverless Handler Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Serverless Handler Database Connection Error',
      error: error.message
    });
  }
}

