import { TravelAgentRateModel } from '../models/travelAgentRateModel.js';
import { notFound } from '../utils/apiResponse.js';

export const TravelAgentRateService = {
  list: () => TravelAgentRateModel.findAll(),
  create: (data) => TravelAgentRateModel.create(data),
  async update(id, data) {
    const updated = await TravelAgentRateModel.update(id, data);
    if (!updated) throw notFound('Rate not found');
    return updated;
  },
  async remove(id) {
    const removed = await TravelAgentRateModel.remove(id);
    if (!removed) throw notFound('Rate not found');
  },
};
