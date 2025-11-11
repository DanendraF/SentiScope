import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/database';
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
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .is('deleted_at', null)
      .single();

    if (existingUser) {
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
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name: fullName || null,
        first_name: firstName || null,
        last_name: lastName || null,
        role: 'user',
        is_active: true,
        email_verified: false,
      })
      .select()
      .single();

    if (insertError || !newUser) {
      console.error('Error registering user:', insertError);
      throw new AppError('Failed to register user', 500);
    }

    const user = this.mapUserResponse(newUser);

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
    const { data: userRow, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .is('deleted_at', null)
      .single();

    if (error || !userRow) {
      throw new AppError('Invalid email or password', 401);
    }

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
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, role, is_active')
        .eq('id', decoded.userId)
        .is('deleted_at', null)
        .single();

      if (error || !user) {
        throw new AppError('User not found', 404);
      }

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
    await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', userId);
  }

  /**
   * Get user profile by ID
   */
  async getUserById(userId: string): Promise<UserResponse> {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, first_name, last_name, role, is_active, email_verified, avatar_url, last_login_at, created_at, updated_at')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !user) {
      throw new AppError('User not found', 404);
    }

    return this.mapUserResponse(user);
  }

  /**
   * Verify email (placeholder for email verification flow)
   */
  async verifyEmail(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('User not found', 404);
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get current password hash
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await supabase
      .from('users')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
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
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);
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
