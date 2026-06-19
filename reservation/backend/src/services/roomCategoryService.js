import { RoomCategoryModel } from '../models/roomCategoryModel.js';
import { conflict, notFound } from '../utils/apiResponse.js';

export const RoomCategoryService = {
  list: () => RoomCategoryModel.findAll(),

  async create({ category, color }) {
    if (await RoomCategoryModel.findByName(category)) throw conflict(`Category "${category}" already exists`);
    return RoomCategoryModel.create({ category, color });
  },

  async update(id, { category, color }) {
    const updated = await RoomCategoryModel.update(id, { category, color });
    if (!updated) throw notFound('Category not found');
    return updated;
  },

  async remove(id) {
    const removed = await RoomCategoryModel.remove(id);
    if (!removed) throw notFound('Category not found');
  },

  /** Resolve a category by id or legacy free-text name. */
  async resolve({ categoryId, category }) {
    if (categoryId) {
      const found = await RoomCategoryModel.findById(categoryId);
      if (!found) throw notFound(`Category id ${categoryId} not found`);
      return found;
    }
    if (category) {
      const found = await RoomCategoryModel.findByName(category);
      if (found) return found;
    }
    throw notFound('Category not found — provide a valid categoryId or category name');
  },
};
