import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { AppError } from '../utils/AppError';

interface RegisterData {
  email: string;
  password: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly JWT_REFRESH_EXPIRES_IN: string;

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
    this.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    const { email, password, name, firstName, lastName } = data;

    // Check if user already exists
    const existingUserQuery = `
      SELECT id FROM users
      WHERE email = $1 AND deleted_at IS NULL
    `;
    const existingUser = await pool.query(existingUserQuery, [email.toLowerCase()]);

    if (existingUser.rows.length > 0) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Auto-populate name field from firstName + lastName if not provided
    let fullName = name;
    if (!fullName && firstName && lastName) {
      fullName = `${firstName} ${lastName}`;
    } else if (!fullName && (firstName || lastName)) {
      fullName = firstName || lastName;
    }

    // Insert new user
    const insertQuery = `
      INSERT INTO users (
        email,
        password_hash,
        name,
        first_name,
        last_name,
        role,
        is_active,
        email_verified
      )
      VALUES ($1, $2, $3, $4, $5, 'user', true, false)
      RETURNING
        id,
        email,
        name,
        first_name,
        last_name,
        role,
        is_active,
        email_verified,
        avatar_url,
        created_at,
        updated_at
    `;

    const result = await pool.query(insertQuery, [
      email.toLowerCase(),
      passwordHash,
      fullName || null,
      firstName || null,
      lastName || null,
    ]);

    const user = this.mapUserResponse(result.rows[0]);

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Update last login
    await this.updateLastLogin(user.id);

    return { user, tokens };
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    const { email, password } = data;

    // Find user
    const query = `
      SELECT
        id,
        email,
        password_hash,
        name,
        first_name,
        last_name,
        role,
        is_active,
        email_verified,
        avatar_url,
        created_at,
        updated_at
      FROM users
      WHERE email = $1 AND deleted_at IS NULL
    `;

    const result = await pool.query(query, [email.toLowerCase()]);

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const userRow = result.rows[0];

    // Check if user is active
    if (!userRow.is_active) {
      throw new AppError('Account is deactivated. Please contact support.', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userRow.password_hash);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Remove password_hash from response
    const { password_hash, ...userData } = userRow;
    const user = this.mapUserResponse(userData);

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Update last login
    await this.updateLastLogin(user.id);

    return { user, tokens };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as JWTPayload;

      // Check if user still exists and is active
      const query = `
        SELECT id, email, role, is_active
        FROM users
        WHERE id = $1 AND deleted_at IS NULL
      `;
      const result = await pool.query(query, [decoded.userId]);

      if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const user = result.rows[0];

      if (!user.is_active) {
        throw new AppError('Account is deactivated', 403);
      }

      // Generate new tokens
      const tokens = this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return tokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid refresh token', 401);
      }
      throw error;
    }
  }

  /**
   * Logout user (client-side token removal, optionally implement token blacklist)
   */
  async logout(userId: string): Promise<void> {
    // Update last_login_at to current time as a logout marker
    // In a production app, you might want to implement a token blacklist
    const query = `
      UPDATE users
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await pool.query(query, [userId]);
  }

  /**
   * Get user profile by ID
   */
  async getUserById(userId: string): Promise<UserResponse> {
    const query = `
      SELECT
        id,
        email,
        name,
        first_name,
        last_name,
        role,
        is_active,
        email_verified,
        avatar_url,
        last_login_at,
        created_at,
        updated_at
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    return this.mapUserResponse(result.rows[0]);
  }

  /**
   * Verify email (placeholder for email verification flow)
   */
  async verifyEmail(userId: string): Promise<void> {
    const query = `
      UPDATE users
      SET
        email_verified = true,
        email_verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await pool.query(query, [userId]);

    if (result.rowCount === 0) {
      throw new AppError('User not found', 404);
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get current password hash
    const query = `
      SELECT password_hash
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const updateQuery = `
      UPDATE users
      SET
        password_hash = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    await pool.query(updateQuery, [newPasswordHash, userId]);
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(payload: JWTPayload): AuthTokens {
    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(userId: string): Promise<void> {
    const query = `
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await pool.query(query, [userId]);
  }

  /**
   * Map database row to UserResponse
   */
  private mapUserResponse(row: any): UserResponse {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      isActive: row.is_active,
      emailVerified: row.email_verified,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default new AuthService();
