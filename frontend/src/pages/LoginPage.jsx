import { useState } from 'react';
import { loginUser } from '../api.js';
import baybridgeLogo from '../assets/logo_baybridge.jpg';
import { Eye, EyeOff } from 'lucide-react';

function LoginPage({ onLoginSuccess }) {
  const [form, setForm]       = useState({ username: '', password: '', userType: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim()) { setError('Username is required'); return; }
    if (!form.password.trim()) { setError('Password is required'); return; }
    setLoading(true);
    try {
      const res = await loginUser(form.username.trim(), form.password, form.userType);
      if (res.success) {
        localStorage.setItem('rms_loggedIn', JSON.stringify(res.user));
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Invalid username or password');
      }
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #e8e8e8', background: '#f9f9fb',
    color: '#1a1a2e', fontSize: '0.88rem', boxSizing: 'border-box',
    outline: 'none', transition: 'border 0.2s, box-shadow 0.2s', fontFamily: 'inherit',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#f0f2f7',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: 20,
    }}>
      <div style={{
        display: 'flex', width: '100%', maxWidth: 900, minHeight: 540,
        borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)', background: '#fff',
      }}>

        {/* ── Left Panel ── */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(150deg, #fce4ec 0%, #fdf2f5 50%, #fff 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '48px 40px', position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative blobs */}
          <div style={{ position: 'absolute', top: -70, left: -70, width: 220, height: 220, borderRadius: '50%', background: 'rgba(233,30,99,0.07)' }} />
          <div style={{ position: 'absolute', bottom: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(233,30,99,0.05)' }} />
          <div style={{ position: 'absolute', top: '35%', right: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(233,30,99,0.04)' }} />

          <div
  style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    position: 'relative',
    zIndex: 1,
  }}
>
  <img
    src={baybridgeLogo}
    alt="Baybridge Solutions"
    style={{
      width: 200,
      height: 'auto',
      objectFit: 'contain',
      filter: 'drop-shadow(0 6px 16px rgba(233,30,99,0.18))',
      display: 'block',
    }}
  />

  <h1
    style={{
      margin: 0,
      fontSize: '2.2rem',
      fontWeight: 900,
      color: '#1a1a2e',
      textAlign: 'center',
      letterSpacing: '-0.03em',
    }}
  >
    Trifecta
  </h1>
</div>

          <p style={{
            margin: '0 0 8px', fontSize: '0.8rem', color: '#e91e63',
            fontWeight: 700, textAlign: 'center', position: 'relative', zIndex: 1,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Hotel Management System
          </p>

          <p style={{ margin: 0, fontSize: '0.73rem', color: '#423f3f', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            by Baybridge Solutions
          </p>

          {/* Tagline */}
          <div style={{
            position: 'absolute', bottom: 22, left: 0, right: 0,
            textAlign: 'center', fontSize: '0.68rem',
            color: '#e91e63', fontWeight: 600, fontStyle: 'italic', opacity: 0.65, zIndex: 1,
          }}>
            "Bridge Towards Your Success"
          </div>
        </div>

        {/* ── Right Panel — Form ── */}
        <div style={{
          flex: 1, padding: '50px 46px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          background: '#fff',
        }}>

          {/* Greeting */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.65rem', fontWeight: 800, color: '#1a1a2e' }}>
              Welcome Back 
            </h2>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#aaa' }}>
              Sign in to access your dashboard
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              background: '#fff5f5', border: '1.5px solid #fcc',
              borderRadius: 10, padding: '10px 14px', marginBottom: 20,
              color: '#c0392b', fontSize: '0.82rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#666', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Username
              </label>
              <input
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="Enter your username"
                autoFocus
                style={inp}
                onFocus={e => { e.target.style.border = '1.5px solid #e91e63'; e.target.style.boxShadow = '0 0 0 3px rgba(233,30,99,0.08)'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.border = '1.5px solid #e8e8e8'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f9f9fb'; }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#666', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Enter your password"
                  style={{ ...inp, paddingRight: 44 }}
                  onFocus={e => { e.target.style.border = '1.5px solid #e91e63'; e.target.style.boxShadow = '0 0 0 3px rgba(233,30,99,0.08)'; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.border = '1.5px solid #e8e8e8'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f9f9fb'; }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: '0.9rem', padding: 2, lineHeight: 1 }}>
                  {showPass ? <EyeOff size={16} color="#171515" /> : <Eye size={16} color="#504e4e" />}
                </button>
              </div>
            </div>

            {/* Login As */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#666', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Login As
              </label>
              <select value={form.userType} onChange={e => setForm(p => ({ ...p, userType: e.target.value }))}
                style={{ ...inp, cursor: 'pointer' }}
                onFocus={e => { e.target.style.border = '1.5px solid #e91e63'; e.target.style.boxShadow = '0 0 0 3px rgba(233,30,99,0.08)'; }}
                onBlur={e => { e.target.style.border = '1.5px solid #e8e8e8'; e.target.style.boxShadow = 'none'; }}>
                <option value="">-- Select Role --</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="receptionist">Receptionist</option>
                <option value="staff">Staff</option>
                <option value="accountant">Accountant</option>
              </select>
            </div>

            {/* Submit button */}
            <button type="submit" disabled={loading}
              style={{
                marginTop: 6, padding: '13px 0', border: 'none', borderRadius: 12,
                background: loading ? '#f48fb1' : 'linear-gradient(135deg, #e91e63, #c2185b)',
                color: '#fff', fontWeight: 800, fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.04em',
                boxShadow: loading ? 'none' : '0 6px 20px rgba(233,30,99,0.3)',
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(233,30,99,0.4)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(233,30,99,0.3)'; }}>
              {loading ? '⏳ Signing in...' : 'Login →'}
            </button>

          </form>

          {/* Forgot password */}
          <p style={{ marginTop: 20, textAlign: 'center', fontSize: '0.75rem', color: '#413d3d' }}>
            Forgot password? Contact your administrator
          </p>

          {/* Footer */}
          <div style={{ marginTop: 'auto', paddingTop: 28, borderTop: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#161414' }}>© 2026 Baybridge Solutions</span>
            <span style={{ fontSize: '0.68rem', background: '#fce4ec', color: '#e91e63', fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>v1.0</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default LoginPage;