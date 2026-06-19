import { SeasonModel } from '../models/seasonModel.js';
import { notFound } from '../utils/apiResponse.js';

export const SeasonService = {
  list: () => SeasonModel.findAll(),
  create: (data) => SeasonModel.create(data),
  async update(id, data) {
    const updated = await SeasonModel.update(id, data);
    if (!updated) throw notFound('Season not found');
    return updated;
  },
  async remove(id) {
    const removed = await SeasonModel.remove(id);
    if (!removed) throw notFound('Season not found');
  },
  async resolve({ seasonId, seasonName }) {
    if (seasonId) {
      const found = await SeasonModel.findById(seasonId);
      if (!found) throw notFound(`Season id ${seasonId} not found`);
      return found;
    }
    if (seasonName) {
      const found = await SeasonModel.findByName(seasonName);
      if (found) return found;
    }
    throw notFound('Season not found — provide a valid seasonId or seasonName');
  },
};
