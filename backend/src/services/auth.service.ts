import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { config } from '../config/environment';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export class AuthService {
  static async register(name: string, email: string, password: string):Promise<{ user: IUser; tokens: TokenPair }> {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      const error: any = new Error('An account with this email address already exists.');
      error.statusCode = 409;
      error.isOperational = true;
      throw error;
    }

    const salt = await bcrypt.genSalt(config.security.bcryptRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash
    });

    const tokens = this.generateTokens(user._id.toString(), user.email);
    return { user, tokens };
  }

  static async login(email: string, password: string): Promise<{ user: IUser; tokens: TokenPair }> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const error: any = new Error('Invalid email or password credentials.');
      error.statusCode = 401;
      error.isOperational = true;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error: any = new Error('Invalid email or password credentials.');
      error.statusCode = 401;
      error.isOperational = true;
      throw error;
    }

    const tokens = this.generateTokens(user._id.toString(), user.email);
    return { user, tokens };
  }

  static async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string; email: string };
      const user = await User.findById(decoded.userId);
      if (!user) {
        const error: any = new Error('User no longer exists.');
        error.statusCode = 401;
        throw error;
      }
      return this.generateTokens(user._id.toString(), user.email);
    } catch (err) {
      const error: any = new Error('Refresh token is invalid or expired.');
      error.statusCode = 401;
      error.isOperational = true;
      throw error;
    }
  }

  static generateTokens(userId: string, email: string): TokenPair {
    const accessToken = jwt.sign({ userId, email }, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiresIn as any
    });

    const refreshToken = jwt.sign({ userId, email }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as any
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwt.accessExpiresIn
    };
  }
}
