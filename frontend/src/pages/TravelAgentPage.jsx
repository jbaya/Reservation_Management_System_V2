import React, { useState } from 'react';
import { copyToClipboard, downloadCSV, printTable } from '../utils/tableExport';

import {
  saveAgent,
  deleteAgent,
  saveThirdParty,
  deleteThirdParty,
  getAgents,
  getThirdParties,
  updateAgent,
updateThirdParty
} from '../api.js';

const TableView = ({
  data,
  type,
  search,
  setSearch,
  thStyle,
  tdStyle,
  handleDelete,
  setEditingItem,
  setEditForm
}) => {

    const filtered = data.filter(d => !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.company?.toLowerCase().includes(search.toLowerCase()));
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
         {['Copy', 'CSV', 'Print'].map(b => (
  <button
    key={b}
    onClick={() => {
      const columns = ['SR.NO', 'NAME', 'COMPANY', 'MOBILE', 'EMAIL', 'GST'];
      const rows = filtered.map((item, idx) => ({
        'SR.NO':   idx + 1,
        'NAME':    item.name || '—',
        'COMPANY': item.company || '—',
        'MOBILE':  item.mobile || '—',
        'EMAIL':   item.email || '—',
        'GST':     item.gst || '—',
      }));

      const title = type === 'agent' ? 'Travel Agents' : 'Third Parties';
      const filename = type === 'agent' ? 'travel-agents.csv' : 'third-parties.csv';

      if (b === 'Copy')  copyToClipboard(rows, columns);
      if (b === 'CSV')   downloadCSV(rows, columns, filename);
      if (b === 'Print') printTable(rows, columns, title);
    }}
    style={{ padding: '5px 14px', border: '1px solid #ddd', borderRadius: 5, background: '#f5f5f5', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#555' }}
  >
    {b}
  </button>
))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.82rem', color: '#666' }}>Search:</span>
 <input
  value={search}
  onChange={(e) => {
    setSearch(e.target.value);
  }}
  onMouseDown={(e) => e.stopPropagation()}
  onClick={(e) => e.stopPropagation()}
  style={{
    padding: '5px 10px',
    borderRadius: 5,
    border: '1px solid #ddd',
    fontSize: '0.78rem',
    width: 200,
    outline: 'none'
  }}
/>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead><tr>{['Sr.no', 'Name', 'Company Name', 'Mobile', 'Email', 'GST Number', 'Action'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={7} style={{ padding: 28, textAlign: 'center', color: '#bbb' }}>No entries found</td></tr>
              : filtered.map((item, idx) => (
                <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  <td style={{ ...tdStyle, color: '#888' }}>{idx + 1}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, textTransform: 'uppercase' }}>{item.name}</td>
                  <td style={tdStyle}>{item.company || '—'}</td>
                  <td style={tdStyle}>{item.mobile || '—'}</td>
                  <td style={tdStyle}>{item.email || '—'}</td>
                  <td style={{ ...tdStyle, color: '#1565c0' }}>{item.gst || '0.00'}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
<button
  onClick={() => {
    setEditingItem(item);

    setEditForm({
      name: item.name || '',
      company: item.company || '',
      email: item.email || '',
      mobile: item.mobile || '',
      gst: item.gst || ''
    });
  }}
  style={{
    color: '#1565c0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.78rem',
    fontWeight: 700
  }}
>
  Edit/
</button>
                      <button onClick={() => handleDelete(item.id, type)} style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        <div style={{ marginTop: 10, fontSize: '0.75rem', color: '#888' }}>Showing {filtered.length} of {data.length} entries</div>
      </div>
    );
  };

function TravelAgentPage({ onAgentsChange, onThirdPartyChange, agents = [], thirdParties = [] }) {
  const [tab, setTab] = useState('add');
  const [refType, setRefType] = useState('agent');
  const [agentSearch, setAgentSearch] = useState('');
const [thirdSearch, setThirdSearch] = useState('');
  const [form, setForm] = useState({ name: '', company: '', email: '', mobile: '', gst: '' });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingItem, setEditingItem] = useState(null);

const [editForm, setEditForm] = useState({
  name: '',
  company: '',
  email: '',
  mobile: '',
  gst: ''
});

  const inp = { padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box', outline: 'none' };
  const lbl = { fontSize: '0.85rem', color: '#444', fontWeight: 600, marginBottom: 4, display: 'block' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.name.trim()) { setError('Name is required'); return; }
    const newEntry = { id: `ta-${Date.now()}`, ...form, name: form.name.trim(), company: form.company.trim() };
    try {

  if (refType === 'agent') {

    if (
      agents.some(
        a => a.name.toLowerCase() === newEntry.name.toLowerCase()
      )
    ) {
      setError('Agent already exists');
      return;
    }

    await saveAgent(newEntry);

    const freshAgents = await getAgents();

    onAgentsChange(freshAgents);

  } else {

    if (
      thirdParties.some(
        t => t.name.toLowerCase() === newEntry.name.toLowerCase()
      )
    ) {
      setError('Third party already exists');
      return;
    }

    await saveThirdParty(newEntry);

    const freshThirdParties = await getThirdParties();

    onThirdPartyChange(freshThirdParties);
  }

} catch (err) {

  console.error(err);
  setError('Failed to save');

  return;
}
    setSuccess(`${refType === 'agent' ? 'Travel Agent' : 'Third Party'} "${form.name}" added!`);
    setForm({ name: '', company: '', email: '', mobile: '', gst: '' });
    setTimeout(() => { setSuccess(''); setTab(refType === 'agent' ? 'agents' : 'third'); }, 1500);
  };

 const handleDelete = async (id, type) => {

  if (!window.confirm('Delete this entry?')) return;

  try {

    if (type === 'agent') {

      await deleteAgent(id);

      const freshAgents = await getAgents();

      onAgentsChange(freshAgents);

    } else {

      await deleteThirdParty(id);

      const freshThirdParties = await getThirdParties();

      onThirdPartyChange(freshThirdParties);
    }

  } catch (err) {

    console.error(err);
    alert('Delete failed');

  }
};

  const thStyle = { padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#555', borderBottom: '2px solid #e0e0e0', fontSize: '0.72rem', letterSpacing: '0.05em', background: '#f0f2f5' };
  const tdStyle = { padding: '9px 12px', fontSize: '0.8rem', borderBottom: '1px solid #eee', color: '#1a1a2e' };

  const handleUpdate = async () => {

  try {

    if (tab === 'agents') {

      await updateAgent(
        editingItem.id,
        editForm
      );

      const freshAgents =
        await getAgents();

      onAgentsChange(freshAgents);

    } else {

      await updateThirdParty(
        editingItem.id,
        editForm
      );

      const freshThirdParties =
        await getThirdParties();

      onThirdPartyChange(
        freshThirdParties
      );
    }

    alert('Updated successfully');

    setEditingItem(null);

  } catch (err) {

    console.error(err);

    alert('Update failed');
  }
};



 

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', color: '#1a1a2e' }}>🤝 Travel Agent / Third Party</h2>
      <div style={{ display: 'flex', borderBottom: '2px solid #e8eaed', marginBottom: 24 }}>
        {[['add', 'Add Booking Reference'], ['agents', 'Travel Agent List'], ['third', 'Third Party List']].map(([key, label]) => (
          <button key={key} onClick={() => {
  setTab(key);
  setAgentSearch('');
  setThirdSearch('');
}} style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', background: tab === key ? '#fff' : '#f7f8fa', fontWeight: tab === key ? 700 : 500, color: tab === key ? '#1565c0' : '#666', fontSize: '0.85rem', borderBottom: tab === key ? '2px solid #1565c0' : '2px solid transparent', marginBottom: -2, borderRadius: '6px 6px 0 0' }}>{label}</button>
        ))}
      </div>

      {tab === 'add' && (
        <form onSubmit={handleSubmit} style={{ maxWidth: 700 }}>
          {error && <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: 7, padding: '8px 14px', color: '#c0392b', fontSize: '0.82rem', marginBottom: 14 }}>❌ {error}</div>}
          {success && <div style={{ background: '#f0fff4', border: '1px solid #9be9a8', borderRadius: 7, padding: '8px 14px', color: '#1e8449', fontSize: '0.82rem', marginBottom: 14 }}>✅ {success}</div>}
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a2e' }}>Booking Reference</span>
            {[['agent', 'Travel Agent'], ['thirdparty', 'Third Party Side']].map(([val, label]) => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.88rem', fontWeight: refType === val ? 700 : 400, color: refType === val ? '#1565c0' : '#555' }}>
                <input type="radio" name="refType" value={val} checked={refType === val} onChange={() => setRefType(val)} />{label}
              </label>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={lbl}>Name *</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={refType === 'agent' ? 'Enter Travel Agent Name..' : 'Enter Name..'} required style={inp} autoFocus /></div>
            <div><label style={lbl}>Company Name *</label><input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Enter Company Name.." style={inp} /></div>
            <div><label style={lbl}>Email</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Enter email id.." style={inp} /></div>
            <div><label style={lbl}>Mobile</label><input value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} placeholder="Enter Mobile No.." style={inp} /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={lbl}>GST Number:</label><input value={form.gst} onChange={e => setForm(p => ({ ...p, gst: e.target.value }))} placeholder="GST Number.." style={{ ...inp, width: '48%' }} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="submit" style={{ padding: '9px 28px', border: 'none', borderRadius: 6, background: '#1e8449', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Submit</button>
            <button type="reset" onClick={() => setForm({ name: '', company: '', email: '', mobile: '', gst: '' })} style={{ padding: '9px 28px', border: '1px solid #ddd', borderRadius: 6, background: '#f5f5f5', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#555' }}>Reset</button>
          </div>
        </form>
      )}
{tab === 'agents' && (
  <TableView
  data={agents}
  type="agent"
  search={agentSearch}
  setSearch={setAgentSearch}
  thStyle={thStyle}
  tdStyle={tdStyle}
  handleDelete={handleDelete}
  setEditingItem={setEditingItem}
  setEditForm={setEditForm}
/>
)}
      {tab === 'third' && (
  <TableView
  data={thirdParties}
  type="thirdparty"
  search={thirdSearch}
  setSearch={setThirdSearch}
  thStyle={thStyle}
  tdStyle={tdStyle}
  handleDelete={handleDelete}
  setEditingItem={setEditingItem}
  setEditForm={setEditForm}
/>
)}
      {editingItem && (

<div
  style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  }}
>

<div
  style={{
    background: '#fff',
    padding: 25,
    width: 500,
    borderRadius: 10
  }}
>

<h3>Edit Details</h3>

<input
  value={editForm.name}
  onChange={e =>
    setEditForm({
      ...editForm,
      name: e.target.value
    })
  }
  placeholder="Name"
  style={{ ...inp, marginBottom: 10 }}
/>

<input
  value={editForm.company}
  onChange={e =>
    setEditForm({
      ...editForm,
      company: e.target.value
    })
  }
  placeholder="Company"
  style={{ ...inp, marginBottom: 10 }}
/>

<input
  value={editForm.email}
  onChange={e =>
    setEditForm({
      ...editForm,
      email: e.target.value
    })
  }
  placeholder="Email"
  style={{ ...inp, marginBottom: 10 }}
/>

<input
  value={editForm.mobile}
  onChange={e =>
    setEditForm({
      ...editForm,
      mobile: e.target.value
    })
  }
  placeholder="Mobile"
  style={{ ...inp, marginBottom: 10 }}
/>

<input
  value={editForm.gst}
  onChange={e =>
    setEditForm({
      ...editForm,
      gst: e.target.value
    })
  }
  placeholder="GST"
  style={{ ...inp, marginBottom: 20 }}
/>

<div
  style={{
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10
  }}
>

<button
  onClick={() =>
    setEditingItem(null)
  }
>
  Cancel
</button>

<button
  onClick={handleUpdate}
>
  Save Changes
</button>

</div>
</div>
</div>

)}
    </div>
  );
}

export default TravelAgentPage;