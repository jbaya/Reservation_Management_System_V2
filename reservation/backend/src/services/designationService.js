import { DesignationModel } from '../models/designationModel.js';
import { conflict, notFound } from '../utils/apiResponse.js';

export const DesignationService = {
  list: () => DesignationModel.findAll(),

  async create(name) {
    const existing = await DesignationModel.findByName(name);
    if (existing) throw conflict(`Designation "${name}" already exists`);
    return DesignationModel.create(name);
  },

  async remove(id) {
    const removed = await DesignationModel.remove(id);
    if (!removed) throw notFound('Designation not found');
  },
};
