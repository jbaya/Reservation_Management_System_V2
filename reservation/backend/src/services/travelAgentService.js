import { TravelAgentModel } from '../models/travelAgentModel.js';
import { conflict, notFound } from '../utils/apiResponse.js';

export const TravelAgentService = {
  list: () => TravelAgentModel.findAll(),

  async create(data) {
    if (await TravelAgentModel.findByName(data.name)) throw conflict(`Agent "${data.name}" already exists`);
    return TravelAgentModel.create(data);
  },

  async update(id, data) {
    const updated = await TravelAgentModel.update(id, data);
    if (!updated) throw notFound('Travel agent not found');
    return updated;
  },

  async remove(id) {
    const removed = await TravelAgentModel.remove(id);
    if (!removed) throw notFound('Travel agent not found');
  },

  async resolve({ agentId, agentName }) {
    if (agentId) {
      const found = await TravelAgentModel.findById(agentId);
      if (!found) throw notFound(`Agent id ${agentId} not found`);
      return found;
    }
    if (agentName) {
      const found = await TravelAgentModel.findByName(agentName);
      if (found) return found;
    }
    return null; // agent is optional on a booking
  },
};
