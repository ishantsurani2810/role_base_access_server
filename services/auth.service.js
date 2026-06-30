import { User } from '../models/user.model.js';
import { Token } from '../models/token.model.js';
import { 
  comparePasswords, 
  generateAccessToken, 
  generateRefreshToken 
} from '../utils/crypto.js';
import { UnauthorizedError, NotFoundError, BadRequestError } from '../utils/errors.js';

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+password').populate('roleId');
  
  if (!user) {
    throw new UnauthorizedError('Invalid email or password credentials.');
  }

  if (user.status === 'Disabled') {
    throw new UnauthorizedError('Your account has been disabled. Please contact the administrator.');
  }

  if (user.status === 'Pending') {
    throw new UnauthorizedError('Your account has not been activated. Please check your invitation email.');
  }

  const isPasswordValid = await comparePasswords(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password credentials.');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  await Token.create({
    userId: user._id,
    token: refreshToken,
    expiresAt
  });

  return {
    accessToken,
    refreshToken,
    user
  };
};

export const rotateTokens = async (providedRefreshToken) => {
  if (!providedRefreshToken) {
    throw new UnauthorizedError('Refresh token is required.');
  }

  // Find token in database
  const tokenRecord = await Token.findOne({ token: providedRefreshToken });
  if (!tokenRecord || tokenRecord.isRevoked) {
    // If token record exists but is revoked, it's a potential replay attach
    if (tokenRecord) {
      await Token.deleteMany({ userId: tokenRecord.userId });
    }
    throw new UnauthorizedError('Invalid or reused refresh token.');
  }

  // Check expiration
  if (new Date() > tokenRecord.expiresAt) {
    await Token.findByIdAndDelete(tokenRecord._id);
    throw new UnauthorizedError('Refresh token has expired.');
  }

  const user = await User.findById(tokenRecord.userId).populate('roleId');
  if (!user || user.status === 'Disabled') {
    throw new UnauthorizedError('User account is invalid or disabled.');
  }

  // Invalidate old token and create new ones
  await Token.findByIdAndDelete(tokenRecord._id);

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 7);

  await Token.create({
    userId: user._id,
    token: newRefreshToken,
    expiresAt: newExpiresAt
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user
  };
};

export const logoutUser = async (refreshToken) => {
  if (refreshToken) {
    await Token.deleteOne({ token: refreshToken });
  }
};
