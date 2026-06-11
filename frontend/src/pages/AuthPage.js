import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_DOCS_URL =
  process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL.replace('/api/v1', '')}/api-docs`
    : 'https://taskflow-backend-4xdz.onrender.com/api-docs';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password, form.role);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const update = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, background: 'var(--accent)', borderRadius: '14px',
            marginBottom: 16, fontSize: 24, color: '#fff', fontWeight: 800,
          }}>
            T
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>TaskFlow</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <div className="card">
          {/* Tab switcher */}
          <div style={{
            display: 'flex', background: 'var(--bg3)', borderRadius: 8,
            padding: 4, marginBottom: 24, gap: 4
          }}>
            {['login', 'register'].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '8px', border: 'none', borderRadius: 6,
                  background: mode === m ? 'var(--accent)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--text-muted)',
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize',
                }}>{m}</button>
            ))}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label>Full Name</label>
                <input value={form.name} onChange={update('name')} placeholder="John Doe" required />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={update('email')}
                placeholder="john@example.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={update('password')}
                placeholder={mode === 'register' ? 'Min 8 chars, uppercase + number' : '••••••••'}
                required />
            </div>
            {mode === 'register' && (
              <div className="form-group">
                <label>Role</label>
                <select value={form.role} onChange={update('role')}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', marginTop: 8, padding: '12px' }}>
              {loading ? <><span className="spinner" /> Processing...</> :
                mode === 'login' ? ' Sign In' : ' Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
          API Docs: <a href={API_DOCS_URL} target="_blank" rel="noreferrer"
            style={{ color: 'var(--accent)' }}>{API_DOCS_URL}</a>
        </p>
      </div>
    </div>
  );
}