import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validator';
import { sendSuccess } from '../utils/apiResponse';
import { User } from '../models/User';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = registerSchema.parse(req.body);
      const { user, tokens } = await AuthService.register(validated.name, validated.email, validated.password);

      sendSuccess(
        res,
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
          },
          tokens
        },
        'User registered successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = loginSchema.parse(req.body);
      const { user, tokens } = await AuthService.login(validated.email, validated.password);

      sendSuccess(
        res,
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
          },
          tokens
        },
        'Logged in successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = refreshSchema.parse(req.body);
      const tokens = await AuthService.refreshToken(validated.refreshToken);
      sendSuccess(res, { tokens }, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    // In stateless JWT architectures, the mobile client discards its stored tokens.
    sendSuccess(res, null, 'Logged out successfully');
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const user = await User.findById(req.user.userId).select('-passwordHash');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      sendSuccess(res, { user }, 'User profile retrieved');
    } catch (error) {
      next(error);
    }
  }
}
