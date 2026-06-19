import { FloorModel } from '../models/floorModel.js';
import { conflict, notFound } from '../utils/apiResponse.js';

export const FloorService = {
  list: () => FloorModel.findAll(),

  async create({ floorNo, label }) {
    if (await FloorModel.findByFloorNo(floorNo)) throw conflict(`Floor ${floorNo} already exists`);
    return FloorModel.create({ floorNo, label });
  },

  async update(id, { floorNo, label }) {
    const updated = await FloorModel.update(id, { floorNo, label });
    if (!updated) throw notFound('Floor not found');
    return updated;
  },

  async remove(id) {
    const removed = await FloorModel.remove(id);
    if (!removed) throw notFound('Floor not found');
  },

  /** Resolve a floor by id, or by floor number/label for callers still
   *  sending the legacy free-text shape — keeps old frontend payloads
   *  working while storage underneath is fully normalized. */
  async resolve({ floorId, floorNo, label }) {
    if (floorId) {
      const floor = await FloorModel.findById(floorId);
      if (!floor) throw notFound(`Floor id ${floorId} not found`);
      return floor;
    }
    if (floorNo !== undefined && floorNo !== null && floorNo !== '') {
      const floor = await FloorModel.findByFloorNo(Number(floorNo));
      if (floor) return floor;
    }
    if (label) {
      const floor = await FloorModel.findByLabel(label);
      if (floor) return floor;
    }
    throw notFound('Floor not found — provide a valid floorId, floorNo, or label');
  },
};
