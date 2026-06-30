import * as authService from '../services/auth.service.js';
import { AuditLog } from '../models/audit.model.js';
import logger from '../utils/logger.js';

const COOKIE_NAME = 'refreshToken';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // 'none' is required for cross-origin requests (client & server on different domains).
  // 'none' MUST be paired with secure: true, which is enforced in production above.
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.loginUser(email, password);

    // Set cookie
    res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());

    // Fire-and-forget audit log — must never block or crash the login response
    AuditLog.create({
      actorId: user._id,
      action: 'USER_LOGIN_SUCCESS',
      module: 'Authentication',
      details: { email: user.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }).catch((auditErr) => logger.error(`Audit log failed (login success): ${auditErr.message}`));

    res.status(200).json({
      status: 'success',
      data: {
        accessToken,
        user
      }
    });
  } catch (err) {
    // Fire-and-forget — audit log failure must not mask the real auth error
    AuditLog.create({
      action: 'USER_LOGIN_FAILED',
      module: 'Authentication',
      details: { email: req.body.email, error: err.message },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }).catch((auditErr) => logger.error(`Audit log failed (login failed): ${auditErr.message}`));

    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    // Read from cookie or body (in case cookies are restricted)
    const token = req.cookies?.[COOKIE_NAME] || req.body.refreshToken;
    const { accessToken, refreshToken: newRefreshToken, user } = await authService.rotateTokens(token);

    res.cookie(COOKIE_NAME, newRefreshToken, getCookieOptions());

    res.status(200).json({
      status: 'success',
      data: {
        accessToken,
        user
      }
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME] || req.body.refreshToken;
    await authService.logoutUser(token);

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    if (req.user) {
      AuditLog.create({
        actorId: req.user._id,
        action: 'USER_LOGOUT',
        module: 'Authentication',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch((auditErr) => logger.error(`Audit log failed (logout): ${auditErr.message}`));
    }

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.'
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    // req.user has already been resolved in protectRouter
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (err) {
    next(err);
  }
};
