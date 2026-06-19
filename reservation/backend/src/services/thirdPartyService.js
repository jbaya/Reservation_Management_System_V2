import { ThirdPartyModel } from '../models/thirdPartyModel.js';
import { conflict, notFound } from '../utils/apiResponse.js';

export const ThirdPartyService = {
  list: () => ThirdPartyModel.findAll(),

  async create(data) {
    if (await ThirdPartyModel.findByName(data.name)) throw conflict(`Third party "${data.name}" already exists`);
    return ThirdPartyModel.create(data);
  },

  async update(id, data) {
    const updated = await ThirdPartyModel.update(id, data);
    if (!updated) throw notFound('Third party not found');
    return updated;
  },

  async remove(id) {
    const removed = await ThirdPartyModel.remove(id);
    if (!removed) throw notFound('Third party not found');
  },

  async resolve({ thirdPartyId, thirdPartyName }) {
    if (thirdPartyId) {
      const found = await ThirdPartyModel.findById(thirdPartyId);
      if (!found) throw notFound(`Third party id ${thirdPartyId} not found`);
      return found;
    }
    if (thirdPartyName) {
      const found = await ThirdPartyModel.findByName(thirdPartyName);
      if (found) return found;
    }
    return null; // optional on a booking
  },
};
