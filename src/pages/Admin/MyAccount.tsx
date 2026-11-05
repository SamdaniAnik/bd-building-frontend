import React, { useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../i18n/LanguageContext';
import { Field, PageHeader, run, useToast } from '../Operations/shared';

// My account: who I am, what my role allows, and changing my password.
export default function MyAccount() {
  const { t } = useLang();
  const { user, canPage } = useAuth();
  const { show, node } = useToast();
  const [f, setF] = useState({ current_password: '', new_password: '', confirm: '' });
  const set = (k: string, v: string) => setF(x => ({ ...x, [k]: v }));
  const mismatch = f.confirm && f.new_password !== f.confirm;
  const save = async () => { if (await run(show, api.post('/auth/password', f))) setF({ current_password: '', new_password: '', confirm: '' }); };
  if (!user) return null;
  const pages = user.is_super ? null : user.pages.filter(p => !p.path.startsWith('/print') && canPage(p.path));
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {node}
      <PageHeader icon="fa-solid fa-id-badge" title={t('My account', 'আমার অ্যাকাউন্ট')} subtitle={`${user.name} · ${user.email}`} />
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card"><div className="card-header"><div className="card-title">{t('My role', 'আমার রোল')}: {user.role_name}</div></div><div className="card-body text-sm">
          {user.is_super ? t('Super admin — full access to everything.', 'সুপার অ্যাডমিন — সবকিছুতে পূর্ণ প্রবেশাধিকার।')
            : user.is_owner_portal ? t('Flat owner portal.', 'ফ্ল্যাট মালিক পোর্টাল।')
              : <>{t('Pages you can open:', 'যে পেজগুলো খুলতে পারেন:')}<ul style={{ paddingLeft: 18 }}>{pages!.map(p => <li key={p.path}>{p.path}{user.permissions.includes(`${p.module}.edit`) ? '' : ` (${t('view only', 'শুধু দেখা')})`}</li>)}</ul></>}
        </div></div>
        <div className="card"><div className="card-header"><div className="card-title">{t('Change password', 'পাসওয়ার্ড পরিবর্তন')}</div></div><div className="card-body">
          <Field label={t('Current password', 'বর্তমান পাসওয়ার্ড')}><input type="password" autoComplete="current-password" className="form-control" value={f.current_password} onChange={e => set('current_password', e.target.value)} /></Field>
          <Field label={t('New password', 'নতুন পাসওয়ার্ড')} hint={t('At least 8 characters', 'অন্তত ৮ অক্ষর')}><input type="password" autoComplete="new-password" className="form-control" value={f.new_password} onChange={e => set('new_password', e.target.value)} /></Field>
          <Field label={t('Repeat new password', 'নতুন পাসওয়ার্ড আবার')} hint={mismatch ? t('Does not match', 'মিলছে না') : undefined}><input type="password" autoComplete="new-password" className="form-control" value={f.confirm} onChange={e => set('confirm', e.target.value)} /></Field>
          <button className="btn btn-primary" disabled={!f.current_password || f.new_password.length < 8 || !!mismatch} onClick={save}>{t('Change password', 'পাসওয়ার্ড পরিবর্তন')}</button>
        </div></div>
      </div>
    </div>
  );
}
