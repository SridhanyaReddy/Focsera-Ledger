import app from '../server/src/server.js';
import { connectDB } from '../server/src/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
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

