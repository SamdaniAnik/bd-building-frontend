
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang, LanguageSelect } from '../i18n/LanguageContext';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const expired = new URLSearchParams(window.location.search).has('expired');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/', { replace: true }); // HomeRedirect picks the first page this role may open
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}><LanguageSelect compact /></div>
        <div className="login-logo">
          <div className="logo-icon"><i className="fa-solid fa-city" /></div>
          <h1>BD Building Management</h1>
          <p>ভবন ব্যবস্থাপনা সিস্টেম</p>
        </div>
        {expired && !error && <div className="alert alert-warning mb-4"><i className="fa-solid fa-clock" /> {t('Your session expired. Please sign in again.', 'আপনার সেশনের মেয়াদ শেষ। আবার প্রবেশ করুন।')}</div>}
        {error && <div className="login-error"><i className="fa-solid fa-circle-exclamation" style={{marginRight:'8px'}} />{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('Email Address', 'ইমেইল ঠিকানা')}</label>
            <input type="email" className="form-control" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="your@email.com" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('Password', 'পাসওয়ার্ড')}</label>
            <input type="password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} required placeholder={t('Enter password', 'পাসওয়ার্ড দিন')} />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <><span className="spinner" style={{display:'inline-block',marginRight:'8px'}} />{t('Signing in...', 'প্রবেশ করা হচ্ছে...')}</> : <><i className="fa-solid fa-right-to-bracket" style={{marginRight:'8px'}} />{t('Sign In', 'প্রবেশ করুন')}</>}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:'20px',fontSize:'0.8rem',color:'var(--gray-400)'}}>
          <i className="fa-solid fa-shield-halved" style={{marginRight:'4px'}} />{t('Secure access for authorized users only', 'শুধুমাত্র অনুমোদিত ব্যবহারকারীদের জন্য')}
        </p>
      </div>
    </div>
  );
}
