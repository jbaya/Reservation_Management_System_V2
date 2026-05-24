import { useState } from 'react';

function SeasonConfigPage({
  seasons = [],
  onSeasonsChange
}) {
  const [form, setForm] = useState({
    name: '',
    fromDate: '',
    toDate: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const inp = {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: '0.85rem',
    width: '100%',
    boxSizing: 'border-box'
  };

  function datesOverlap(aStart, aEnd, bStart, bEnd) {
    return (
      new Date(aStart) <= new Date(bEnd) &&
      new Date(bStart) <= new Date(aEnd)
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (
      !form.name ||
      !form.fromDate ||
      !form.toDate
    ) {
      setError('All fields are required');
      return;
    }

    if (
      new Date(form.fromDate) >
      new Date(form.toDate)
    ) {
      setError('From date cannot be after To date');
      return;
    }

    const overlap = seasons.some((s) => {
      if (editingId && s.id === editingId) return false;

      return datesOverlap(
        form.fromDate,
        form.toDate,
        s.fromDate,
        s.toDate
      );
    });

    if (overlap) {
      setError(
        'Season dates overlap with existing season'
      );
      return;
    }

    if (editingId) {
      onSeasonsChange(
        seasons.map((s) =>
          s.id === editingId
            ? {
                ...s,
                ...form
              }
            : s
        )
      );

      setSuccess('Season updated');
    } else {
      onSeasonsChange([
        ...seasons,
        {
          id: `season-${Date.now()}`,
          ...form
        }
      ]);

      setSuccess('Season added');
    }

    setForm({
      name: '',
      fromDate: '',
      toDate: ''
    });

    setEditingId(null);
  };

  const handleEdit = (season) => {
    setForm({
      name: season.name,
      fromDate: season.fromDate,
      toDate: season.toDate
    });

    setEditingId(season.id);
    setError('');
    setSuccess('');
  };

  const handleDelete = (id) => {
    if (
      !window.confirm(
        'Delete this season?'
      )
    )
      return;

    onSeasonsChange(
      seasons.filter((s) => s.id !== id)
    );
  };

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1000
      }}
    >
      <h2
        style={{
          marginBottom: 20
        }}
      >
        🌤 Season Configuration
      </h2>

      {error && (
        <div
          style={{
            background: '#fff5f5',
            border: '1px solid #fcc',
            padding: 10,
            borderRadius: 6,
            color: '#c0392b',
            marginBottom: 12
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background: '#f0fff4',
            border: '1px solid #b7e4c7',
            padding: 10,
            borderRadius: 6,
            color: '#1e8449',
            marginBottom: 12
          }}
        >
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gridTemplateColumns:
            '1fr 1fr 1fr auto',
          gap: 12,
          marginBottom: 30
        }}
      >
        <input
          placeholder="Season Name"
          value={form.name}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              name: e.target.value
            }))
          }
          style={inp}
        />

        <input
          type="date"
          value={form.fromDate}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              fromDate: e.target.value
            }))
          }
          style={inp}
        />

        <input
          type="date"
          value={form.toDate}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              toDate: e.target.value
            }))
          }
          style={inp}
        />

        <button
          type="submit"
          style={{
            padding: '8px 18px',
            border: 'none',
            background: '#1565c0',
            color: '#fff',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          {editingId
            ? 'Update'
            : 'Add'}
        </button>
      </form>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}
      >
        <thead>
          <tr
            style={{
              background: '#f5f7fa'
            }}
          >
            <th style={{ padding: 10 }}>
              Season
            </th>
            <th style={{ padding: 10 }}>
              From
            </th>
            <th style={{ padding: 10 }}>
              To
            </th>
            <th style={{ padding: 10 }}>
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {seasons.map((s) => (
            <tr key={s.id}>
              <td style={{ padding: 10 }}>
                {s.name}
              </td>
              <td style={{ padding: 10 }}>
                {s.fromDate}
              </td>
              <td style={{ padding: 10 }}>
                {s.toDate}
              </td>
              <td style={{ padding: 10 }}>
                <button
                  onClick={() =>
                    handleEdit(s)
                  }
                  style={{
                    marginRight: 8
                  }}
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    handleDelete(s.id)
                  }
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SeasonConfigPage;