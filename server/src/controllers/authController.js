import crypto from 'crypto';
import Admin from '../models/Admin.js';
import CompanySettings from '../models/CompanySettings.js';
import Division from '../models/Division.js';
import { PREDEFINED_DIVISIONS, DEFAULT_COMPANY_DETAILS } from '../config/constants.js';
import { signToken } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getSetupStatus(req, res) {
  try {
    const adminCount = await Admin.countDocuments();
    const settings = await CompanySettings.findOne({ isSingleton: true });

    const isInitialized = adminCount > 0;
    const isConfigured = Boolean(settings && settings.isConfigured);

    return res.json({
      success: true,
      data: {
        isInitialized,
        isConfigured,
        adminCount,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function setupInitialAdmin(req, res) {
  try {
    const existingAdmins = await Admin.countDocuments();
    if (existingAdmins > 0) {
      return res.status(400).json({
        success: false,
        message: 'System is already initialized. Public registration is permanently disabled.',
      });
    }

    const { email, password, name, companyDetails } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // 1. Create Admin
    const passwordHash = await Admin.hashPassword(password);
    const admin = await Admin.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name || 'Focsera Administrator',
      role: 'ADMIN',
      lastLogin: new Date(),
    });

    // 2. Initialize Divisions
    for (const div of PREDEFINED_DIVISIONS) {
      await Division.findOneAndUpdate(
        { code: div.code },
        { ...div, isActive: true },
        { upsert: true, new: true }
      );
    }

    // 3. Initialize Company Settings
    let settings = await CompanySettings.findOne({ isSingleton: true });
    if (!settings) {
      settings = await CompanySettings.create({
        isSingleton: true,
        ...DEFAULT_COMPANY_DETAILS,
        ...(companyDetails || {}),
        isConfigured: true,
      });
    } else {
      Object.assign(settings, DEFAULT_COMPANY_DETAILS, companyDetails || {}, { isConfigured: true });
      await settings.save();
    }

    const token = signToken(admin);

    await logAuditEvent({
      action: 'INITIAL_SYSTEM_SETUP',
      entity: 'Admin',
      entityId: admin._id,
      performedBy: admin.email,
      details: { email: admin.email, company: settings.legalName },
      ip: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Focsera initial setup completed successfully.',
      data: {
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
        company: settings,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = signToken(admin);
    const settings = await CompanySettings.getSettings();

    await logAuditEvent({
      action: 'ADMIN_LOGIN',
      entity: 'Admin',
      entityId: admin._id,
      performedBy: admin.email,
      ip: req.ip,
    });

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          lastLogin: admin.lastLogin,
        },
        company: settings,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMe(req, res) {
  try {
    const settings = await CompanySettings.getSettings();
    return res.json({
      success: true,
      data: {
        admin: req.admin,
        company: settings,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
    }

    const admin = await Admin.findById(req.admin._id);
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    admin.passwordHash = await Admin.hashPassword(newPassword);
    await admin.save();

    await logAuditEvent({
      action: 'CHANGE_PASSWORD',
      entity: 'Admin',
      entityId: admin._id,
      performedBy: admin.email,
      ip: req.ip,
    });

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email: email?.toLowerCase()?.trim() });

    if (!admin) {
      // Return success message to prevent user enumeration
      return res.json({
        success: true,
        message: 'If that email belongs to the admin account, a reset token has been generated.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    admin.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    admin.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await admin.save();

    // In a production server with mailer, send email. For internal app, return token for admin convenience
    return res.json({
      success: true,
      message: 'Password reset token generated.',
      resetToken, // Provided for direct verification in interface or logs
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    admin.passwordHash = await Admin.hashPassword(newPassword);
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    return res.json({ success: true, message: 'Password has been reset successfully. Please log in.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

