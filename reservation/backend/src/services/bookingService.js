import { BookingModel } from '../models/bookingModel.js';
import { RoomModel } from '../models/roomModel.js';
import { RoomCategoryService } from './roomCategoryService.js';
import { TravelAgentService } from './travelAgentService.js';
import { ThirdPartyService } from './thirdPartyService.js';
import { badRequest, notFound } from '../utils/apiResponse.js';

/** Accepts either the new canonical shape (roomIds: number[]) or the
 *  legacy shape the old frontend sends (roomNumbers: string[], or a
 *  single roomName string for a one-room booking) and resolves everything
 *  down to room_id values that the FK-based booking_rooms table needs.
 *  This bridge lets the existing UI keep working unmodified against the
 *  new, fully-normalized schema while the frontend is migrated in step. */
async function resolveRoomIds({ roomIds, roomNumbers, roomName }) {
  if (Array.isArray(roomIds) && roomIds.length > 0) return roomIds;

  const numbers = Array.isArray(roomNumbers) && roomNumbers.length > 0
    ? roomNumbers
    : (roomName ? [roomName] : []);

  if (numbers.length === 0) return [];

  const resolved = await Promise.all(numbers.map((no) => RoomModel.findByRoomNo(no)));
  const missing = numbers.filter((_, i) => !resolved[i]);
  if (missing.length > 0) throw badRequest(`Unknown room number(s): ${missing.join(', ')}`);
  return resolved.map((r) => r.room_id);
}

async function buildBookingData(input) {
  const [category, agent, thirdParty, roomIds] = await Promise.all([
    input.categoryId || input.roomCategory
      ? RoomCategoryService.resolve({ categoryId: input.categoryId, category: input.roomCategory })
      : null,
    TravelAgentService.resolve({ agentId: input.agentId, agentName: input.agentName }),
    ThirdPartyService.resolve({ thirdPartyId: input.thirdPartyId, thirdPartyName: input.thirdPartyName }),
    resolveRoomIds(input),
  ]);

  const totalAmount = input.totalAmount ?? 0;
  const paidAmount = input.paidAmount ?? 0;

  return {
    ...input,
    categoryId: category?.id || null,
    agentId: agent?.id || null,
    thirdPartyId: thirdParty?.id || null,
    roomIds,
    totalAmount,
    paidAmount,
    // balance is always derived server-side from amount/paid, never trusted
    // verbatim from the client — closes a class of bug where a stale UI
    // could push an inconsistent balance.
    balance: Math.max(totalAmount - paidAmount, 0),
  };
}

export const BookingService = {
  list: () => BookingModel.findAll(),

  async get(id) {
    const booking = await BookingModel.findById(id);
    if (!booking) throw notFound('Booking not found');
    return booking;
  },

  async create(input, actor) {
    if (!input.id) throw badRequest('id is required');
    const data = await buildBookingData(input);
    const booking = await BookingModel.create(data);
    await BookingModel.addAuditEntry(booking.id, {
      action: 'created',
      changedBy: actor?.username || 'system',
    });
    return booking;
  },

  async update(id, input, actor) {
    const data = await buildBookingData(input);
    const booking = await BookingModel.update(id, data);
    if (!booking) throw notFound('Booking not found');
    await BookingModel.addAuditEntry(id, {
      action: 'updated',
      changedBy: actor?.username || 'system',
      details: input,
    });
    return booking;
  },

  async remove(id) {
    const removed = await BookingModel.remove(id);
    if (!removed) throw notFound('Booking not found');
  },

  async addComment(id, { author, commentText }) {
    const booking = await BookingModel.findById(id);
    if (!booking) throw notFound('Booking not found');
    return BookingModel.addComment(id, { author, commentText });
  },
};
