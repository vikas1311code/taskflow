const { query } = require('../config/database');
const xss = require('xss');

const TaskModel = {
  async create({ title, description, status, priority, due_date, user_id }) {
    const result = await query(
      `INSERT INTO tasks (title, description, status, priority, due_date, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        xss(title.trim()),
        description ? xss(description.trim()) : null,
        status || 'pending',
        priority || 'medium',
        due_date || null,
        user_id,
      ]
    );
    return result.rows[0];
  },

  async findById(id, userId = null) {
    const result = await query(
      `SELECT t.*, u.name as owner_name, u.email as owner_email
       FROM tasks t JOIN users u ON t.user_id = u.id
       WHERE t.id = $1 ${userId ? 'AND t.user_id = $2' : ''}`,
      userId ? [id, userId] : [id]
    );
    return result.rows[0] || null;
  },

  async findAll({ page = 1, limit = 10, userId = null, status, priority, search } = {}) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (userId) { conditions.push(`t.user_id = $${paramCount++}`); params.push(userId); }
    if (status) { conditions.push(`t.status = $${paramCount++}`); params.push(status); }
    if (priority) { conditions.push(`t.priority = $${paramCount++}`); params.push(priority); }
    if (search) {
      conditions.push(`(t.title ILIKE $${paramCount} OR t.description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const result = await query(
      `SELECT t.*, u.name as owner_name FROM tasks t JOIN users u ON t.user_id = u.id
       ${whereClause} ORDER BY t.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM tasks t ${whereClause}`,
      params.slice(0, -2)
    );

    return { tasks: result.rows, total: parseInt(countResult.rows[0].count) };
  },

  async update(id, userId, { title, description, status, priority, due_date }) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) { fields.push(`title = $${paramCount++}`); values.push(xss(title.trim())); }
    if (description !== undefined) { fields.push(`description = $${paramCount++}`); values.push(description ? xss(description.trim()) : null); }
    if (status !== undefined) { fields.push(`status = $${paramCount++}`); values.push(status); }
    if (priority !== undefined) { fields.push(`priority = $${paramCount++}`); values.push(priority); }
    if (due_date !== undefined) { fields.push(`due_date = $${paramCount++}`); values.push(due_date || null); }

    if (!fields.length) return null;

    values.push(id);
    const userCondition = userId ? ` AND user_id = $${paramCount + 1}` : '';
    if (userId) values.push(userId);

    const result = await query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramCount}${userCondition} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id, userId = null) {
    const result = await query(
      `DELETE FROM tasks WHERE id = $1 ${userId ? 'AND user_id = $2' : ''} RETURNING id`,
      userId ? [id, userId] : [id]
    );
    return result.rows.length > 0;
  },

  async getStats(userId = null) {
    const whereClause = userId ? 'WHERE user_id = $1' : '';
    const params = userId ? [userId] : [];
    const result = await query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
       FROM tasks ${whereClause}`,
      params
    );
    return result.rows[0];
  },
};

module.exports = TaskModel;
