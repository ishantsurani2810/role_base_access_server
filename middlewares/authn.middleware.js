import { verifyAccessToken } from '../utils/crypto.js';
import { User } from '../models/user.model.js';
import { UnauthorizedError } from '../utils/errors.js';

export const protectRouter = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(new UnauthorizedError('Access token is missing. Access denied.'));
    }

    // Verify token claims and signatures
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return next(new UnauthorizedError('Invalid or expired access token. Please login again.'));
    }

    // Load active profile with role details
    const currentUser = await User.findById(decoded.id).populate('roleId');
    if (!currentUser) {
      return next(new UnauthorizedError('The user belonging to this token no longer exists.'));
    }

    if (currentUser.status === 'Disabled') {
      return next(new UnauthorizedError('This user account has been disabled. Please contact Admin.'));
    }

    if (currentUser.status === 'Pending') {
      return next(new UnauthorizedError('This account is pending verification. Please accept the invitation first.'));
    }

    // Inject user context details into payload request
    req.user = currentUser;
    next();
  } catch (err) {
    next(err);
  }
};
