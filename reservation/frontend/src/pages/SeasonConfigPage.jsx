import { useState } from 'react';

import {
  saveSeason,
  updateSeason,
  deleteSeason
} from '../api';

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

  const handleSubmit = async (e) => {
  e.preventDefault();

  setError('');
  setSuccess('');

  if (!form.name || !form.fromDate || !form.toDate) {
    setError('All fields are required');
    return;
  }

  if (new Date(form.fromDate) > new Date(form.toDate)) {
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
    setError('Season dates overlap with existing season');
    return;
  }

  try {

    if (editingId) {

      await updateSeason(editingId, form);

      onSeasonsChange(
        seasons.map((s) =>
          s.id === editingId
            ? { ...s, ...form }
            : s
        )
      );

      setSuccess('Season updated');

    } else {

      const saved = await saveSeason(form);

      onSeasonsChange([
        ...seasons,
        {
          id: saved.id,
          name: saved.name,
          fromDate: saved.from_date
            ? `${new Date(saved.from_date).getFullYear()}-${String(new Date(saved.from_date).getMonth()+1).padStart(2,'0')}-${String(new Date(saved.from_date).getDate()).padStart(2,'0')}`
            : form.fromDate,
          toDate: saved.to_date
            ? `${new Date(saved.to_date).getFullYear()}-${String(new Date(saved.to_date).getMonth()+1).padStart(2,'0')}-${String(new Date(saved.to_date).getDate()).padStart(2,'0')}`
            : form.toDate,
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

  } catch (err) {

    console.error(err);

    setError('Failed to save season');
  }
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

  const handleDelete = async (id) => {

  if (!window.confirm('Delete this season?'))
    return;

  try {

    await deleteSeason(id);

    onSeasonsChange(
      seasons.filter((s) => s.id !== id)
    );

    setSuccess('Season deleted');

  } catch (err) {

    console.error(err);

    setError('Failed to delete season');
  }
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
    borderCollapse: 'collapse',
    marginTop: 20
  }}
>
  <thead>
    <tr
      style={{
        background: '#f5f7fa'
      }}
    >
      <th style={{ padding: '14px', textAlign: 'left' }}>
        Season
      </th>

      <th style={{ padding: '14px', textAlign: 'left' }}>
        From
      </th>

      <th style={{ padding: '14px', textAlign: 'left' }}>
        To
      </th>

      <th style={{ padding: '14px', textAlign: 'left' }}>
        Action
      </th>
    </tr>
  </thead>

  <tbody>
  {seasons.map((s) => (
    <tr
      key={s.id}
      style={{
        borderBottom: '1px solid #e5e7eb',
        transition: '0.2s'
      }}
    >
      <td
        style={{
          padding: '14px',
          textAlign: 'left',
          fontWeight: 500
        }}
      >
        {s.name}
      </td>

      <td
        style={{
          padding: '14px',
          textAlign: 'left'
        }}
      >
        {s.fromDate}
      </td>

      <td
        style={{
          padding: '14px',
          textAlign: 'left'
        }}
      >
        {s.toDate}
      </td>

      <td
        style={{
          padding: '14px',
          textAlign: 'left'
        }}
      >
        <button
          onClick={() => handleEdit(s)}
          style={{
            minWidth: '70px',
            height: '34px',
            marginRight: '8px',
            border: 'none',
            borderRadius: '4px',
            background: '#6c757d',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Edit
        </button>

        <button
          onClick={() => handleDelete(s.id)}
          style={{
            minWidth: '70px',
            height: '34px',
            border: 'none',
            borderRadius: '4px',
            background: '#dc3545',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 500
          }}
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