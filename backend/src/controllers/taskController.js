const TaskModel = require('../models/Task');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const logger = require('../utils/logger');

const createTask = async (req, res) => {
  try {
    const task = await TaskModel.create({ ...req.body, user_id: req.user.id });
    return successResponse(res, { task }, 'Task created successfully', 201);
  } catch (error) {
    logger.error('Create task error:', error);
    return errorResponse(res, 'Failed to create task', 500);
  }
};

const getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, search } = req.query;

    // Admins see all tasks; users see only their own
    const userId = req.user.role === 'admin' ? null : req.user.id;

    const { tasks, total } = await TaskModel.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      userId,
      status,
      priority,
      search,
    });

    return paginatedResponse(res, { tasks }, total, page, limit, 'Tasks retrieved');
  } catch (error) {
    logger.error('Get tasks error:', error);
    return errorResponse(res, 'Failed to retrieve tasks', 500);
  }
};

const getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const task = await TaskModel.findById(id, userId);

    if (!task) return errorResponse(res, 'Task not found', 404);
    return successResponse(res, { task }, 'Task retrieved');
  } catch (error) {
    logger.error('Get task error:', error);
    return errorResponse(res, 'Failed to retrieve task', 500);
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.role === 'admin' ? null : req.user.id;

    const task = await TaskModel.update(id, userId, req.body);
    if (!task) return errorResponse(res, 'Task not found or unauthorized', 404);

    return successResponse(res, { task }, 'Task updated successfully');
  } catch (error) {
    logger.error('Update task error:', error);
    return errorResponse(res, 'Failed to update task', 500);
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.role === 'admin' ? null : req.user.id;

    const deleted = await TaskModel.delete(id, userId);
    if (!deleted) return errorResponse(res, 'Task not found or unauthorized', 404);

    return successResponse(res, null, 'Task deleted successfully');
  } catch (error) {
    logger.error('Delete task error:', error);
    return errorResponse(res, 'Failed to delete task', 500);
  }
};

const getTaskStats = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const stats = await TaskModel.getStats(userId);
    return successResponse(res, { stats }, 'Stats retrieved');
  } catch (error) {
    return errorResponse(res, 'Failed to get stats', 500);
  }
};

module.exports = { createTask, getTasks, getTask, updateTask, deleteTask, getTaskStats };
