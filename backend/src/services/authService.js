const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class AuthService {
  generateAccessToken(userId) {
    return jwt.sign({ id: userId }, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiresIn,
    });
  }

  generateRefreshToken(userId) {
    return jwt.sign({ id: userId, type: 'refresh' }, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });
  }

  async register({ name, email, password }) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered.', 409);
    }

    // First user becomes admin, all others start as viewer
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : 'viewer';

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
    });

    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    logger.info('User registered', { userId: user._id, role: assignedRole });

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  async login({ email, password }) {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    logger.info('User logged in', { userId: user._id });

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      if (decoded.type !== 'refresh') {
        throw new AppError('Invalid token type.', 401);
      }

      const user = await User.findById(decoded.id).select('+refreshToken');
      if (!user || user.refreshToken !== token) {
        throw new AppError('Invalid refresh token.', 401);
      }

      const accessToken = this.generateAccessToken(user._id);
      return { accessToken };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Invalid refresh token.', 401);
    }
  }

  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    logger.info('User logged out', { userId });
  }

  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found.', 404);
    return user.toJSON();
  }
}

module.exports = new AuthService();