import { useState, useEffect } from 'react';
import {
  getUsers, saveUser, updateUser, deleteUser,
  getDesignations, saveDesignation, deleteDesignation
} from '../api.js';

function UserPage() {
  const [tab, setTab] = useState('list');
  const [users, setUsers] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [newDesignation, setNewDesignation] = useState('');
  const [search, setSearch] = useState('');

  const emptyForm = {
    full_name: '', gender: 'male', mobile: '', email: '',
    designation: '', username: '', password: '',
    user_type: 'staff', status: 'active',
  };
  const [form, setForm] = useState(emptyForm);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    try {
      const [u, d] = await Promise.all([getUsers(), getDesignations()]);
      setUsers(u || []);
      setDesignations(d || []);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // ── Shared styles ──────────────────────────────────────────────────────────
  const inp = {
    padding: '8px 11px', borderRadius: 6, border: '1px solid #ddd',
    fontSize: '0.83rem', width: '100%', boxSizing: 'border-box',
    outline: 'none', background: '#fff', color: '#1a1a2e',
  };
  const lbl = { fontSize: '0.8rem', fontWeight: 700, color: '#444', marginBottom: 4, display: 'block' };

  const statusColor = (s) => s === 'active' ? '#1e8449' : '#e74c3c';

  // ── Add/Edit user submit ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!form.full_name.trim()) { setError('Full name is required'); return; }
    if (!form.username.trim())  { setError('Username is required'); return; }
    if (!form.password.trim())  { setError('Password is required'); return; }
    if (!form.designation)      { setError('Designation is required'); return; }
    if (!form.user_type)        { setError('User type is required'); return; }

    try {
      if (editingUser) {
        const res = await updateUser(editingUser.id, form);
        if (res.error) { setError(res.error); return; }
        setSuccess('User updated successfully!');
      } else {
        const res = await saveUser(form);
        if (res.error) { setError(res.error); return; }
        setSuccess('User added successfully!');
      }
      await loadAll();
      setForm(emptyForm);
      setEditingUser(null);
      setTimeout(() => { setSuccess(''); setTab('list'); }, 1500);
    } catch {
      setError('Failed to save user');
    }
  };

  // ── Delete user ────────────────────────────────────────────────────────────
  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.full_name}"?`)) return;
    try {
      await deleteUser(user.id);
      await loadAll();
    } catch {
      alert('Failed to delete user');
    }
  };

  // ── Edit user ──────────────────────────────────────────────────────────────
  const handleEdit = (user) => {
    setForm({
      full_name:   user.full_name   || '',
      gender:      user.gender      || 'male',
      mobile:      user.mobile      || '',
      email:       user.email       || '',
      designation: user.designation || '',
      username:    user.username    || '',
      password:    user.password    || '',
      user_type:   user.user_type   || 'staff',
      status:      user.status      || 'active',
    });
    setEditingUser(user);
    setError(''); setSuccess('');
    setTab('add');
  };

  // ── Add designation ────────────────────────────────────────────────────────
  const handleAddDesignation = async (e) => {
    e.preventDefault();
    if (!newDesignation.trim()) { alert('Enter designation name'); return; }
    try {
      const res = await saveDesignation(newDesignation.trim());
      if (res.error) { alert(res.error); return; }
      setNewDesignation('');
      await loadAll();
    } catch {
      alert('Failed to save designation');
    }
  };

  const handleDeleteDesignation = async (id, name) => {
    if (!window.confirm(`Delete designation "${name}"?`)) return;
    try {
      await deleteDesignation(id);
      await loadAll();
    } catch {
      alert('Failed to delete designation');
    }
  };

  const filteredUsers = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.designation?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.2rem', color: '#1a1a2e' }}>👥 User Management</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e8eaed', marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          ['list',         'View User List'],
          ['add',          editingUser ? 'Edit User' : 'Add User'],
          ['designation',  'Control User Access'],
          ['desig-list',   'User Access List'],
        ].map(([key, label]) => (
          <button key={key}
            onClick={() => {
              setTab(key);
              if (key !== 'add') { setEditingUser(null); setForm(emptyForm); setError(''); setSuccess(''); }
            }}
            style={{
              padding: '10px 18px', border: 'none', cursor: 'pointer',
              background: tab === key ? '#fff' : '#f7f8fa',
              fontWeight: tab === key ? 700 : 500,
              color: tab === key ? '#1565c0' : '#666',
              fontSize: '0.83rem',
              borderBottom: tab === key ? '2px solid #1565c0' : '2px solid transparent',
              marginBottom: -2, borderRadius: '6px 6px 0 0',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: User List ── */}
      {tab === 'list' && (
        <div>
          {/* Search */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.82rem', color: '#666' }}>Search:</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Name / Username / Designation"
                style={{ ...inp, width: 240 }} />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Loading...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f0f2f5' }}>
                  {['SR.NO', 'NAME', 'GENDER', 'EMAIL', 'MOBILE', 'DESIGNATION', 'USER TYPE', 'USERNAME', 'STATUS', 'ACTION'].map(h => (
                    <th key={h} style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 700, color: '#555', borderBottom: '2px solid #e0e0e0', fontSize: '0.72rem', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={10} style={{ padding: 28, textAlign: 'center', color: '#bbb' }}>No users found</td></tr>
                ) : filteredUsers.map((u, idx) => (
                  <tr key={u.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9', borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px 10px', color: '#aaa' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: '#1a1a2e' }}>{u.full_name}</td>
                    <td style={{ padding: '8px 10px', textTransform: 'capitalize', color: '#555' }}>{u.gender || '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#555', fontSize: '0.75rem' }}>{u.email || '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#555' }}>{u.mobile || '—'}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ background: '#e3f0ff', color: '#1565c0', padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }}>
                        {u.designation || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', textTransform: 'capitalize', color: '#555' }}>{u.user_type || '—'}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1a1a2e' }}>{u.username}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        background: statusColor(u.status) + '18',
                        color: statusColor(u.status),
                        border: `1px solid ${statusColor(u.status)}44`,
                        padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700,
                        textTransform: 'capitalize',
                      }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleEdit(u)}
                          style={{ color: '#1565c0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                          EDIT
                        </button>
                        <span style={{ color: '#ddd' }}>/</span>
                        <button onClick={() => handleDelete(u)}
                          style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                          DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ marginTop: 10, fontSize: '0.75rem', color: '#888' }}>
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      )}

      {/* ── TAB 2: Add / Edit User ── */}
      {tab === 'add' && (
        <form onSubmit={handleSubmit} style={{ maxWidth: 700 }}>
          {error   && <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: 7, padding: '8px 14px', color: '#c0392b', fontSize: '0.82rem', marginBottom: 14 }}>❌ {error}</div>}
          {success && <div style={{ background: '#f0fff4', border: '1px solid #9be9a8', borderRadius: 7, padding: '8px 14px', color: '#1e8449', fontSize: '0.82rem', marginBottom: 14 }}>✅ {success}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            <div>
              <label style={lbl}>Full Name *</label>
              <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Enter full name" style={inp} autoFocus />
            </div>

            <div>
              <label style={lbl}>Gender</label>
              <div style={{ display: 'flex', gap: 20, paddingTop: 8 }}>
                {['male', 'female'].map(g => (
                  <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.83rem', fontWeight: form.gender === g ? 700 : 400, color: form.gender === g ? '#1565c0' : '#555' }}>
                    <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={() => setForm(p => ({ ...p, gender: g }))} />
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl}>Mobile No.</label>
              <input value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                placeholder="Enter mobile number" style={inp} />
            </div>

            <div>
              <label style={lbl}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="Enter email" style={inp} />
            </div>

            <div>
              <label style={lbl}>Designation *</label>
              <select value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} style={inp}>
                <option value="">-- Select Designation --</option>
                {designations.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={lbl}>User Type *</label>
              <select value={form.user_type} onChange={e => setForm(p => ({ ...p, user_type: e.target.value }))} style={inp}>
                <option value="">-- Select User Type --</option>
                {['admin', 'manager', 'receptionist', 'staff', 'accountant'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={lbl}>Username *</label>
              <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="Enter username" style={inp}
                readOnly={!!editingUser}
                title={editingUser ? 'Username cannot be changed' : ''}
              />
              {editingUser && <div style={{ fontSize: '0.65rem', color: '#e67e22', marginTop: 3 }}>⚠️ Username cannot be changed</div>}
            </div>

            <div>
              <label style={lbl}>Password *</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Enter password" style={inp} />
            </div>

            <div>
              <label style={lbl}>Status *</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={inp}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button type="submit"
              style={{ padding: '9px 28px', border: 'none', borderRadius: 6, background: '#1e8449', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
              {editingUser ? '💾 Update User' : '➕ Add User'}
            </button>
            <button type="button"
              onClick={() => { setForm(emptyForm); setEditingUser(null); setError(''); }}
              style={{ padding: '9px 24px', border: '1px solid #ddd', borderRadius: 6, background: '#f5f5f5', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#555' }}>
              Reset
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 3: Control User Access (Add Designation) ── */}
      {tab === 'designation' && (
        <div style={{ maxWidth: 500 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#1a1a2e', fontWeight: 700 }}>Add New Designation</h3>
          <form onSubmit={handleAddDesignation} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <input
              value={newDesignation}
              onChange={e => setNewDesignation(e.target.value)}
              placeholder="Add New Designation.."
              style={{ ...inp, flex: 1 }}
              autoFocus
            />
            <button type="submit"
              style={{ padding: '8px 20px', border: 'none', borderRadius: 6, background: '#1565c0', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.83rem', whiteSpace: 'nowrap' }}>
              + Add
            </button>
            <button type="button" onClick={() => setNewDesignation('')}
              style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: 6, background: '#f5f5f5', cursor: 'pointer', fontSize: '0.83rem', color: '#555' }}>
              Reset
            </button>
          </form>

          <div style={{ background: '#f8f9fa', border: '1px solid #e8eaed', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Existing Designations ({designations.length})
            </div>
            {designations.length === 0 ? (
              <div style={{ color: '#bbb', fontSize: '0.82rem', textAlign: 'center', padding: 16 }}>No designations yet</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {designations.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, padding: '5px 10px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1a1a2e' }}>{d.name}</span>
                    <button onClick={() => handleDeleteDesignation(d.id, d.name)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '0.75rem', padding: '0 2px' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#e74c3c'}
                      onMouseLeave={e => e.currentTarget.style.color = '#ccc'}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: User Access List (Designations table) ── */}
      {tab === 'desig-list' && (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f0f2f5' }}>
                {['SR.NO', 'DESIGNATION', 'ACTION'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#555', borderBottom: '2px solid #e0e0e0', fontSize: '0.72rem', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {designations.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: 28, textAlign: 'center', color: '#bbb' }}>No designations found</td></tr>
              ) : designations.map((d, idx) => (
                <tr key={d.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9', borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px 14px', color: '#aaa' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1565c0', textTransform: 'uppercase' }}>{d.name}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => handleDeleteDesignation(d.id, d.name)}
                      style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 10, fontSize: '0.75rem', color: '#888' }}>
            {designations.length} designation{designations.length !== 1 ? 's' : ''} configured
          </div>
        </div>
      )}
    </div>
  );
}

export default UserPage;