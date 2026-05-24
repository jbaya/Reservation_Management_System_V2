import React, { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth
} from 'date-fns';

function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function CategoryMonthlySummary({
  rooms,
  bookings,
  selectedDate,
  categoryColors
}) {
  const summaryData = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);

    const categoryMap = {};

    rooms.forEach(room => {
      if (!categoryMap[room.category]) {
        categoryMap[room.category] = {
          category: room.category,
          totalRooms: 0,
          occupiedRooms: 0
        };
      }

      categoryMap[room.category].totalRooms++;

      const isOccupied = bookings.some(booking => {
        if (booking.roomName !== room.name) return false;

        if (
          ['cancelled', 'no-show'].includes(
            booking.status
          )
        ) {
          return false;
        }

        return overlaps(
          new Date(booking.arrival),
          new Date(booking.departure),
          monthStart,
          monthEnd
        );
      });

      if (isOccupied) {
        categoryMap[room.category].occupiedRooms++;
      }
    });

    return Object.values(categoryMap).map(item => ({
      ...item,
      vacantRooms:
        item.totalRooms - item.occupiedRooms
    }));
  }, [rooms, bookings, selectedDate]);

  return (
    <div
      style={{
        background: '#fff',
        borderBottom: '1px solid #ddd',
        padding: '10px 14px',
        overflowX: 'auto'
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: '0.8rem',
          marginBottom: 10,
          color: '#1a1a2e'
        }}
      >
        Category-wise Monthly Room Availability
      </div>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.75rem'
        }}
      >
        <thead>
          <tr
            style={{
              background: '#f7f8fa'
            }}
          >
            <th style={{ padding: 8, textAlign: 'left' }}>
              Category
            </th>
            <th style={{ padding: 8 }}>
              Total Rooms
            </th>
            <th style={{ padding: 8 }}>
              Occupied
            </th>
            <th style={{ padding: 8 }}>
              Vacant
            </th>
          </tr>
        </thead>

        <tbody>
          {summaryData.map(item => {
            const color =
              categoryColors?.[item.category]
                ?.border || '#1565c0';

            return (
              <tr
                key={item.category}
                style={{
                  borderBottom:
                    '1px solid #eee'
                }}
              >
                <td
                  style={{
                    padding: 8,
                    fontWeight: 700,
                    color
                  }}
                >
                  {item.category}
                </td>

                <td
                  style={{
                    padding: 8,
                    textAlign: 'center'
                  }}
                >
                  {item.totalRooms}
                </td>

                <td
                  style={{
                    padding: 8,
                    textAlign: 'center',
                    color: '#1e8449',
                    fontWeight: 700
                  }}
                >
                  {item.occupiedRooms}
                </td>

                <td
                  style={{
                    padding: 8,
                    textAlign: 'center',
                    color: '#c0392b',
                    fontWeight: 700
                  }}
                >
                  {item.vacantRooms}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default CategoryMonthlySummary;