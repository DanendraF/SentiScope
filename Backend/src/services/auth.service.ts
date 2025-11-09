import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userService } from './user.service';
import { AppError } from '../utils/AppError';
import pool from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const authService = {
  async register(
    email: string,
    password: string,
    name: string,
    firstName?: string,
    lastName?: string
  ) {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await userService.create({
      email,
      password: hashedPassword,
      name,
      firstName,
      lastName,
    });

    // Generate token
    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      token,
      refreshToken,
    };
  },

  async login(email: string, password: string) {
    // Find user
    const user = await userService.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    const updateQuery = 'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1';
    await pool.query(updateQuery, [user.id]).catch(() => {
      // Ignore error if update fails
    });

    // Generate token
    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      token,
      refreshToken,
    };
  },

  async refreshToken(refreshToken: string) {
    try {
      if (!JWT_REFRESH_SECRET) {
        throw new AppError('JWT_REFRESH_SECRET is not configured', 500);
      }
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET as string) as {
        userId: string;
      };
      return this.generateToken(decoded.userId);
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  },

  generateToken(userId: string): string {
    if (!JWT_SECRET) {
      throw new AppError('JWT_SECRET is not configured', 500);
    }
    return jwt.sign({ userId }, JWT_SECRET as string, {
      expiresIn: JWT_EXPIRES_IN as string,
    } as jwt.SignOptions);
  },

  generateRefreshToken(userId: string): string {
    if (!JWT_REFRESH_SECRET) {
      throw new AppError('JWT_REFRESH_SECRET is not configured', 500);
    }
    return jwt.sign({ userId }, JWT_REFRESH_SECRET as string, {
      expiresIn: JWT_REFRESH_EXPIRES_IN as string,
    } as jwt.SignOptions);
  },
};

