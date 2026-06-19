import { BASE, get, post, put, del } from './client.js';

export const getAgents    = ()        => get(`${BASE}/agents`);
export const saveAgent    = (agent)   => post(`${BASE}/agents`, agent);
export const updateAgent  = (id, agent) => put(`${BASE}/agents/${id}`, agent);
export const deleteAgent  = (id)      => del(`${BASE}/agents/${id}`);
