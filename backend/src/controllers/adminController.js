const UserModel = require('../models/User');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { revokeAllUserTokens } = require('../utils/jwt');
const logger = require('../utils/logger');
const { body } = require('express-validator');

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const { users, total } = await UserModel.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      role,
    });
    return paginatedResponse(res, { users }, total, page, limit, 'Users retrieved');
  } catch (error) {
    logger.error('Get all users error:', error);
    return errorResponse(res, 'Failed to retrieve users', 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, { user }, 'User retrieved');
  } catch (error) {
    return errorResponse(res, 'Failed to retrieve user', 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, is_active } = req.body;

    if (id === req.user.id && is_active === false) {
      return errorResponse(res, 'Cannot deactivate your own account', 400);
    }

    const user = await UserModel.update(id, { name, email, role, is_active });
    if (!user) return errorResponse(res, 'User not found', 404);

    if (is_active === false) {
      await revokeAllUserTokens(id);
    }

    return successResponse(res, { user }, 'User updated');
  } catch (error) {
    logger.error('Update user error:', error);
    return errorResponse(res, 'Failed to update user', 500);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return errorResponse(res, 'Cannot delete your own account', 400);
    }
    const user = await UserModel.findById(id);
    if (!user) return errorResponse(res, 'User not found', 404);

    await revokeAllUserTokens(id);
    await UserModel.delete(id);
    return successResponse(res, null, 'User deleted');
  } catch (error) {
    logger.error('Delete user error:', error);
    return errorResponse(res, 'Failed to delete user', 500);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
