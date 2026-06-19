import { BASE, get, post, del, authHeaders, handleUnauthorized } from './client.js';

export const getBookings  = ()          => get(`${BASE}/bookings`);
export const saveBooking  = (booking)   => post(`${BASE}/bookings`, booking);
export const deleteBooking = (id)       => del(`${BASE}/bookings/${id}`);

export const updateBooking = async (id, data) => {
  const res = await fetch(`${BASE}/bookings/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (res.status === 401) { handleUnauthorized(); throw new Error('Session expired'); }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
};
