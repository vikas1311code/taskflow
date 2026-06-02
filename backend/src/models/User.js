const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const UserModel = {
  async create({ name, email, password, role = 'user' }) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, is_active, created_at`,
      [name.trim(), email.toLowerCase(), passwordHash, role]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await query(
      `SELECT id, name, email, password_hash, role, is_active, created_at
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await query(
      `SELECT id, name, email, role, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findAll({ page = 1, limit = 10, role } = {}) {
    const offset = (page - 1) * limit;
    const params = [limit, offset];
    let whereClause = '';
    if (role) {
      whereClause = 'WHERE role = $3';
      params.push(role);
    }
    const result = await query(
      `SELECT id, name, email, role, is_active, created_at FROM users
       ${whereClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      params
    );
    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      role ? [role] : []
    );
    return { users: result.rows, total: parseInt(countResult.rows[0].count) };
  },

  async update(id, { name, email, role, is_active }) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) { fields.push(`name = $${paramCount++}`); values.push(name.trim()); }
    if (email !== undefined) { fields.push(`email = $${paramCount++}`); values.push(email.toLowerCase()); }
    if (role !== undefined) { fields.push(`role = $${paramCount++}`); values.push(role); }
    if (is_active !== undefined) { fields.push(`is_active = $${paramCount++}`); values.push(is_active); }

    if (!fields.length) return null;
    values.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, email, role, is_active, updated_at`,
      values
    );
    return result.rows[0] || null;
  },

  async updatePassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, id]);
  },

  async verifyPassword(plainPassword, hash) {
    return bcrypt.compare(plainPassword, hash);
  },

  async delete(id) {
    await query(`DELETE FROM users WHERE id = $1`, [id]);
  },
};

module.exports = UserModel;
