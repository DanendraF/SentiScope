import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';

export const userController = {
  getProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const profile = await userService.getProfile(userId);
      res.json({
        message: 'Profile retrieved successfully',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  },

  updateProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const { name, email } = req.body;
      const updatedProfile = await userService.updateProfile(userId, {
        name,
        email,
      });
      res.json({
        message: 'Profile updated successfully',
        data: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteAccount: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      await userService.deleteAccount(userId);
      res.json({
        message: 'Account deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

