import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/userModel.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiResponse.js';

export const AuthService = {
  async login(username, password) {
    const user = await UserModel.findByUsername(username);
    if (!user) throw new ApiError(401, 'Invalid username or password');
    if (user.status !== 'active') throw new ApiError(403, 'This account is inactive');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new ApiError(401, 'Invalid username or password');

    const token = jwt.sign(
      { id: user.id, username: user.username, userType: user.user_type },
      env.jwtSecret,
      { expiresIn: '12h' }
    );

    return {
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        userType: user.user_type,
      },
    };
  },
};
