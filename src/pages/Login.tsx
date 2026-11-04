
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@bdbuilding.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/buildings');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon"><i className="fa-solid fa-city" /></div>
          <h1>BD Building Management</h1>
          <p>ভবন ব্যবস্থাপনা সিস্টেম</p>
        </div>
        {error && <div className="login-error"><i className="fa-solid fa-circle-exclamation" style={{marginRight:'8px'}} />{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-control" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="your@email.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Enter password" />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <><span className="spinner" style={{display:'inline-block',marginRight:'8px'}} />Signing in...</> : <><i className="fa-solid fa-right-to-bracket" style={{marginRight:'8px'}} />Sign In</>}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:'20px',fontSize:'0.8rem',color:'var(--gray-400)'}}>
          <i className="fa-solid fa-shield-halved" style={{marginRight:'4px'}} />Secure access for authorized users only
        </p>
      </div>
    </div>
  );
}
