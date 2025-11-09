import { AppError } from '../utils/AppError';
import pool from '../config/database';

export const userService = {
  async create(userData: {
    email: string;
    password: string;
    name: string;
    firstName?: string;
    lastName?: string;
  }) {
    const { email, password, name, firstName, lastName } = userData;

    // Check if user already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    // Insert user into database
    const query = `
      INSERT INTO users (email, password_hash, name, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, first_name, last_name, created_at, updated_at
    `;

    const result = await pool.query(query, [
      email,
      password,
      name,
      firstName || null,
      lastName || null,
    ]);

    return result.rows[0];
  },

  async findByEmail(email: string) {
    const query = 'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  },

  async findById(id: string) {
    const query = 'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },

  async getProfile(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Remove password from response
    const { password_hash, ...profile } = user;
    return profile;
  },

  async updateProfile(userId: string, updates: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  }) {
    const user = await this.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.firstName !== undefined) {
      updateFields.push(`first_name = $${paramIndex++}`);
      values.push(updates.firstName);
    }
    if (updates.lastName !== undefined) {
      updateFields.push(`last_name = $${paramIndex++}`);
      values.push(updates.lastName);
    }
    if (updates.email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      values.push(updates.email);
    }

    if (updateFields.length === 0) {
      return this.getProfile(userId);
    }

    values.push(userId);
    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING id, email, name, first_name, last_name, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async deleteAccount(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Soft delete
    const query = `
      UPDATE users 
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await pool.query(query, [userId]);
  },
};

