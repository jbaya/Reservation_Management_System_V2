import { BASE, get, post, del } from './client.js';

export const getDesignations    = ()      => get(`${BASE}/users/designations`);
export const saveDesignation    = (name)  => post(`${BASE}/users/designations`, { name });
export const deleteDesignation  = (id)    => del(`${BASE}/users/designations/${id}`);
