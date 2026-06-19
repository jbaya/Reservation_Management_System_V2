import { useCallback } from 'react';
import { saveRoom, getRooms, deleteRoom, updateRoom } from '../api.js';
import { sortRoomList } from '../utils/roomUtils.js';

/** Room CRUD — add/delete/update a single room. Exact port of the original App.jsx handlers. */
export function useRoomActions({ bookings, setRooms }) {
  const handleAddRoom = useCallback(async (room) => {
    try {
      await saveRoom({
        name: room.name,
        category: room.category,
        floor: room.floor || '1',
        capacity: room.capacity || 2,
      });

      const freshRooms = await getRooms();
      setRooms(sortRoomList(freshRooms));
    } catch (err) {
      console.error('❌ Save failed:', err);
      alert('Failed to save room');
    }
  }, [setRooms]);

  const handleDeleteRoom = useCallback(async (name) => {
    if (
      bookings.some(
        b => b.roomName === name && !['cancelled', 'no-show'].includes(b.status)
      )
    ) {
      alert('Cannot delete room with active bookings');
      return;
    }

    if (!window.confirm(`Delete room ${name}?`)) return;

    try {
      await deleteRoom(name);
      const freshRooms = await getRooms();
      setRooms(sortRoomList(freshRooms));
      alert(`Room ${name} deleted successfully`);
    } catch (err) {
      console.error('❌ Delete failed:', err);
      alert('Failed to delete room');
    }
  }, [bookings, setRooms]);

  const handleUpdateRoom = useCallback(async (oldRoomNo, updatedRoom) => {
    try {
      await updateRoom(oldRoomNo, {
        roomNo: updatedRoom.roomNo,
        category: updatedRoom.category,
        floor: updatedRoom.floor,
        capacity: updatedRoom.capacity || 2,
      });

      const freshRooms = await getRooms();
      setRooms(sortRoomList(freshRooms));
      alert('Room updated successfully');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Room number already exists');
    }
  }, [setRooms]);

  return { handleAddRoom, handleDeleteRoom, handleUpdateRoom };
}
