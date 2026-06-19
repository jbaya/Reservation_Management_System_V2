import { BASE, get, post, put, del } from './client.js';

export const getThirdParties    = ()      => get(`${BASE}/third-parties`);
export const saveThirdParty     = (tp)    => post(`${BASE}/third-parties`, tp);
export const updateThirdParty   = (id, tp) => put(`${BASE}/third-parties/${id}`, tp);
export const deleteThirdParty   = (id)    => del(`${BASE}/third-parties/${id}`);
