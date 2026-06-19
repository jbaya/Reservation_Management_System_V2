import { SpecialDateModel } from '../models/specialDateModel.js';
import { notFound } from '../utils/apiResponse.js';

export const SpecialDateService = {
  list: () => SpecialDateModel.findAll(),
  create: (data) => SpecialDateModel.create(data),
  async update(id, data) {
    const updated = await SpecialDateModel.update(id, data);
    if (!updated) throw notFound('Special date not found');
    return updated;
  },
  async remove(id) {
    const removed = await SpecialDateModel.remove(id);
    if (!removed) throw notFound('Special date not found');
  },
};
