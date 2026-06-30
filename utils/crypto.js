import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/environment.js';

const SALT_ROUNDS = 12;

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePasswords = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export const generateAccessToken = (user) => {
  // Pass dynamic user fields to claims 
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      role: user.roleId?.name || (user.roleName || 'Employee')
    },
    config.jwtAccessSecret,
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id },
    config.jwtRefreshSecret,
    { expiresIn: '7d' }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwtAccessSecret);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwtRefreshSecret);
};

export const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};
