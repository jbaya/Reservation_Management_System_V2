import { useState } from 'react';
import {
  saveRate,
  updateRate,
  deleteRate,
  getRates
} from '../api.js';

function TravelAgentRateConfig({
  agents = [],
  seasons = [],
  categoryColors = {},
  travelAgentRates = [],
  onRatesChange
}) {
  const [form, setForm] = useState({
    agentName: '',
    roomCategory: '',
    seasonId: '',
    roomRate: '',
    extraPersonRate: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const inp = {
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: '0.82rem',
    width: '100%',
    boxSizing: 'border-box'
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  setError('');
  setSuccess('');

  if (
    !form.agentName ||
    !form.roomCategory ||
    !form.seasonId ||
    !form.roomRate
  ) {
    setError('Please fill all required fields');
    return;
  }

  const selectedSeason = seasons.find(
    s => s.id === form.seasonId
  );

  const duplicate = travelAgentRates.some(rate => {
    if (editingId && rate.id === editingId) return false;

    return (
      rate.agentName === form.agentName &&
      rate.roomCategory === form.roomCategory &&
      rate.seasonId === form.seasonId
    );
  });

  if (duplicate) {
    setError(
      'Rate already exists for this travel agent, category and season'
    );
    return;
  }

  const payload = {
    id: editingId || `rate-${Date.now()}`,
    agentName: form.agentName,
    roomCategory: form.roomCategory,
    seasonId: form.seasonId,
    seasonName: selectedSeason?.name || '',
    roomRate: Number(form.roomRate),
    extraPersonRate: Number(form.extraPersonRate || 0)
  };

  try {

    if (editingId) {

      await updateRate(editingId, payload);

      setSuccess('Rate updated successfully');

    } else {

      await saveRate(payload);

      setSuccess('Rate added successfully');
    }

    const freshRates = await getRates();

    onRatesChange(freshRates);

    setForm({
      agentName: '',
      roomCategory: '',
      seasonId: '',
      roomRate: '',
      extraPersonRate: ''
    });

    setEditingId(null);

  } catch (err) {

    console.error(err);

    setError('Failed to save rate');
  }
};

  const handleEdit = (rate) => {
    setForm({
      agentName: rate.agentName,
      roomCategory: rate.roomCategory,
      seasonId: rate.seasonId,
      roomRate: rate.roomRate,
      extraPersonRate: rate.extraPersonRate
    });

    setEditingId(rate.id);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {

  if (!window.confirm('Delete this rate?')) return;

  try {

    await deleteRate(id);

    const freshRates = await getRates();

    onRatesChange(freshRates);

  } catch (err) {

    console.error(err);

    alert('Delete failed');
  }
};

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 20 }}>
        💰 Travel Agent Rate Configuration
      </h2>

      {error && (
        <div
          style={{
            background: '#fff5f5',
            border: '1px solid #fcc',
            color: '#c0392b',
            padding: 10,
            borderRadius: 6,
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
            color: '#1e8449',
            padding: 10,
            borderRadius: 6,
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
            '1.2fr 1fr 1fr 1fr 1fr auto',
          gap: 10,
          marginBottom: 24
        }}
      >
        <select
          value={form.agentName}
          onChange={(e) =>
            setForm({
              ...form,
              agentName: e.target.value
            })
          }
          style={inp}
        >
          <option value="">Select Travel Agent</option>
          {agents.map(agent => (
            <option key={agent.name} value={agent.name}>
              {agent.name}
            </option>
          ))}
        </select>

        <select
          value={form.roomCategory}
          onChange={(e) =>
            setForm({
              ...form,
              roomCategory: e.target.value
            })
          }
          style={inp}
        >
          <option value="">Room Category</option>
          {Object.keys(categoryColors).map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={form.seasonId}
          onChange={(e) =>
            setForm({
              ...form,
              seasonId: e.target.value
            })
          }
          style={inp}
        >
          <option value="">Select Season</option>
          {seasons.map(season => (
            <option key={season.id} value={season.id}>
              {season.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Room Rate"
          value={form.roomRate}
          onChange={(e) =>
            setForm({
              ...form,
              roomRate: e.target.value
            })
          }
          style={inp}
        />

        <input
          type="number"
          placeholder="Extra Person"
          value={form.extraPersonRate}
          onChange={(e) =>
            setForm({
              ...form,
              extraPersonRate: e.target.value
            })
          }
          style={inp}
        />

        <button
          type="submit"
          style={{
            padding: '8px 14px',
            border: 'none',
            background: '#1565c0',
            color: '#fff',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          {editingId ? 'Update' : 'Add'}
        </button>
      </form>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: '#fff'
        }}
      >
        <thead>
          <tr style={{ background: '#f5f7fa' }}>
            <th style={{ padding: 10 }}>Agent</th>
            <th style={{ padding: 10 }}>Category</th>
            <th style={{ padding: 10 }}>Season</th>
            <th style={{ padding: 10 }}>Room Rate</th>
            <th style={{ padding: 10 }}>Extra Person</th>
            <th style={{ padding: 10 }}>Action</th>
          </tr>
        </thead>

        <tbody>
          {travelAgentRates.map(rate => (
            <tr key={rate.id}>
              <td style={{ padding: 10 }}>{rate.agentName}</td>
              <td style={{ padding: 10 }}>{rate.roomCategory}</td>
              <td style={{ padding: 10 }}>{rate.seasonName}</td>
              <td style={{ padding: 10 }}>₹{rate.roomRate}</td>
              <td style={{ padding: 10 }}>
                ₹{rate.extraPersonRate}
              </td>
              <td style={{ padding: 10 }}>
                <button
                  onClick={() => handleEdit(rate)}
                  style={{ marginRight: 8 }}
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(rate.id)}
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

export default TravelAgentRateConfig;