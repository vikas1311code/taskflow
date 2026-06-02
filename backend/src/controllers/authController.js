const UserModel = require('../models/User');
const {
  generateTokens,
  saveRefreshToken,
  verifyRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
  revokeAllUserTokens,
} = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return errorResponse(res, 'Email already registered', 409);
    }

    const user = await UserModel.create({ name, email, password, role });

    const { accessToken, refreshToken } = generateTokens(user);
    await saveRefreshToken(user.id, refreshToken);

    logger.info(`New user registered: ${email} (${role || 'user'})`);

    return successResponse(
      res,
      {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken,
      },
      'Registration successful',
      201
    );
  } catch (error) {
    logger.error('Register error:', error);
    return errorResponse(res, 'Registration failed', 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    if (!user.is_active) {
      return errorResponse(res, 'Account deactivated. Contact admin.', 403);
    }

    const isValid = await UserModel.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const { accessToken, refreshToken } = generateTokens(user);
    await saveRefreshToken(user.id, refreshToken);

    logger.info(`User logged in: ${email}`);

    return successResponse(res, {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    }, 'Login successful');
  } catch (error) {
    logger.error('Login error:', error);
    return errorResponse(res, 'Login failed', 500);
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return errorResponse(res, 'Refresh token required', 400);

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return errorResponse(res, 'Invalid refresh token', 401);
    }

    const isValid = await isRefreshTokenValid(token);
    if (!isValid) {
      return errorResponse(res, 'Refresh token expired or revoked', 401);
    }

    const user = await UserModel.findById(decoded.sub);
    if (!user || !user.is_active) {
      return errorResponse(res, 'User not found or deactivated', 401);
    }

    // Rotate refresh token
    await revokeRefreshToken(token);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    await saveRefreshToken(user.id, newRefreshToken);

    return successResponse(res, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed');
  } catch (error) {
    logger.error('Refresh token error:', error);
    return errorResponse(res, 'Token refresh failed', 500);
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (token) await revokeRefreshToken(token);
    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    return successResponse(res, null, 'Logged out');
  }
};

const getMe = async (req, res) => {
  return successResponse(res, { user: req.user }, 'Profile retrieved');
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await UserModel.findByEmail(req.user.email);

    const isValid = await UserModel.verifyPassword(currentPassword, user.password_hash);
    if (!isValid) return errorResponse(res, 'Current password is incorrect', 400);

    await UserModel.updatePassword(req.user.id, newPassword);
    await revokeAllUserTokens(req.user.id);

    return successResponse(res, null, 'Password changed. Please login again.');
  } catch (error) {
    logger.error('Change password error:', error);
    return errorResponse(res, 'Password change failed', 500);
  }
};

module.exports = { register, login, refreshToken, logout, getMe, changePassword };
