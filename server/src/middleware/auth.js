import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const JWT_SECRET = process.env.JWT_SECRET || 'focsera-secret-key-production-financial-system-2026';

export function signToken(admin) {
  return jwt.sign(
    {
      id: admin._id,
      email: admin.email,
      role: 'ADMIN',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function requireAdmin(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in as Focsera Admin.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Admin privileges required.',
      });
    }

    const admin = await Admin.findById(decoded.id).select('-passwordHash');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin account not found or deactivated.',
      });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.',
    });
  }
}

