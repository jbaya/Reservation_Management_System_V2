import bcrypt from 'bcryptjs';
import { UserModel } from '../models/userModel.js';
import { DesignationService } from './designationService.js';
import { conflict, notFound } from '../utils/apiResponse.js';

const SALT_ROUNDS = 10;

export const UserService = {
  list: () => UserModel.findAll(),

  async create({ fullName, gender, mobile, email, designationId, designationName, username, password, userType, status }) {
    if (await UserModel.findByUsername(username)) throw conflict(`Username "${username}" is already taken`);
    let resolvedDesignationId = designationId || null;
    if (!resolvedDesignationId && designationName) {
      const d = await DesignationService.list().then((all) => all.find((x) => x.name.toLowerCase() === designationName.toLowerCase()));
      resolvedDesignationId = d?.id || null;
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    return UserModel.create({ fullName, gender, mobile, email, designationId: resolvedDesignationId, username, passwordHash, userType, status });
  },

  async update(id, { fullName, gender, mobile, email, designationId, userType, status, password }) {
    const passwordHash = password ? await bcrypt.hash(password, SALT_ROUNDS) : null;
    const updated = await UserModel.update(id, { fullName, gender, mobile, email, designationId, userType, status, passwordHash });
    if (!updated) throw notFound('User not found');
    return updated;
  },

  async remove(id) {
    const removed = await UserModel.remove(id);
    if (!removed) throw notFound('User not found');
  },
};
