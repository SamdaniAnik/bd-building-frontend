import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../i18n/LanguageContext';
import { dateTime, Empty, Field, Modal, PageHeader, Stat, Tabs, run, useToast, Notify } from '../Operations/shared';
import { isValidBdMobile } from '../../utils/bd';

// Users, roles & permissions. The server re-checks everything (routes/rbac.js), including that nobody can
// hand out permissions they do not hold themselves.
type Tab = 'users' | 'roles';

export default function AccessControl() {
  const { t } = useLang();
  const { can } = useAuth();
  const [tab, setTab] = useState<Tab>('users');
  const { show, node } = useToast();
  const [catalog, setCatalog] = useState<any>(null);
  const [roles, setRoles] = useState<any[] | null>(null);
  const loadRoles = () => api.get('/rbac/roles').then((r: any) => setRoles(r.rows)).catch((e: any) => show(false, e.message));
  useEffect(() => { api.get('/rbac/catalog').then(setCatalog).catch((e: any) => show(false, e.message)); loadRoles(); }, []);
  const editable = can('users.edit');
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {node}
      <PageHeader icon="fa-solid fa-user-lock" title={t('Users, Roles & Permissions', 'ব্যবহারকারী, রোল ও অনুমতি')}
        subtitle={t('Who can log in, and what each role may see and change. Changes take effect within seconds — no re-login needed.', 'কে লগইন করতে পারবে এবং প্রতিটি রোল কী দেখতে ও পরিবর্তন করতে পারবে। পরিবর্তন কয়েক সেকেন্ডে কার্যকর হয় — আবার লগইন লাগে না।')} />
      {!editable && <div className="alert alert-info mb-4"><i className="fa-solid fa-eye" /> {t('Your role can view this page but not change it.', 'আপনার রোলে এই পেজ দেখা যায়, পরিবর্তন করা যায় না।')}</div>}
      <Tabs value={tab} onChange={setTab} tabs={[
        { key: 'users', label: t('Users', 'ব্যবহারকারী'), icon: 'fa-solid fa-users' },
        { key: 'roles', label: t('Roles & permissions', 'রোল ও অনুমতি'), icon: 'fa-solid fa-shield-halved' },
      ]} />
      {tab === 'users' && roles && <UsersTab roles={roles} editable={editable} show={show} onChanged={loadRoles} />}
      {tab === 'roles' && roles && catalog && <RolesTab roles={roles} catalog={catalog} editable={editable} show={show} onChanged={loadRoles} />}
    </div>
  );
}

// ── Users ───────────────────────────────────────────────────────
function UsersTab({ roles, editable, show, onChanged }: { roles: any[]; editable: boolean; show: Notify; onChanged: () => void }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [d, setD] = useState<any>(null);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showOwners, setShowOwners] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [pw, setPw] = useState<any>(null);
  const load = () => api.get('/rbac/users').then(setD).catch((e: any) => show(false, e.message));
  useEffect(() => { load(); }, []);
  const roleOf = (id: any) => roles.find(r => r.id_roles === Number(id));
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const save = async () => {
    const body = { ...form };
    if (form.id_users) delete body.password;
    const r = await run(show, form.id_users ? api.put(`/rbac/users/${form.id_users}`, body) : api.post('/rbac/users', body));
    if (r) { setForm(null); load(); onChanged(); }
  };
  const toggle = async (u: any) => {
    if (u.is_active && !confirm(t(`Deactivate ${u.name}? They are logged out at once.`, `${u.name}-কে নিষ্ক্রিয় করবেন? সঙ্গে সঙ্গে লগআউট হবেন।`))) return;
    if (await run(show, api.put(`/rbac/users/${u.id_users}`, { is_active: !u.is_active }), u.is_active ? t('Deactivated', 'নিষ্ক্রিয় করা হয়েছে') : t('Activated', 'সক্রিয় করা হয়েছে'))) load();
  };
  const savePw = async () => { if (await run(show, api.post(`/rbac/users/${pw.id_users}/password`, { password: pw.password }))) setPw(null); };
  const rows = (d?.rows || []).filter((u: any) => (showOwners || !u.is_owner_portal) && (!roleFilter || String(u.id_roles) === roleFilter)
    && (!q || `${u.name} ${u.email} ${u.phone || ''} ${u.owner_name || ''}`.toLowerCase().includes(q.toLowerCase())));
  const staff = (d?.rows || []).filter((u: any) => !u.is_owner_portal);
  const role = form ? roleOf(form.id_roles) : null;
  const phoneBad = form?.phone && !isValidBdMobile(form.phone);
  const genPassword = () => { const c = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const a = new Uint32Array(12); crypto.getRandomValues(a); return Array.from(a, x => c[x % c.length]).join(''); };

  return (
    <>
      <div className="stats-grid">
        <Stat icon="fa-solid fa-user-tie" value={staff.filter((u: any) => u.is_active).length} label={t('Active staff logins', 'সক্রিয় কর্মী লগইন')} />
        <Stat icon="fa-solid fa-house-user" value={(d?.rows || []).filter((u: any) => u.is_owner_portal && u.is_active).length} label={t('Owner portal logins', 'মালিক পোর্টাল লগইন')} tone="info" />
        <Stat icon="fa-solid fa-user-slash" value={(d?.rows || []).filter((u: any) => !u.is_active).length} label={t('Deactivated', 'নিষ্ক্রিয়')} tone="warning" />
      </div>
      <div className="card">
        <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="form-control" style={{ width: 230 }} placeholder={t('Search name, email, phone', 'নাম, ইমেইল, ফোন')} aria-label={t('Search users', 'ব্যবহারকারী খুঁজুন')} value={q} onChange={e => setQ(e.target.value)} />
            <select className="form-select" style={{ width: 200 }} aria-label={t('Role', 'রোল')} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">{t('All roles', 'সব রোল')}</option>{roles.map(r => <option key={r.id_roles} value={r.id_roles}>{bn && r.name_bn ? r.name_bn : r.name_en}</option>)}</select>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={showOwners} onChange={e => setShowOwners(e.target.checked)} /> {t('Show owner portal logins', 'মালিক পোর্টাল লগইনও দেখান')}</label>
          </div>
          {editable && <button className="btn btn-primary" onClick={() => setForm({ name: '', email: '', phone: '', password: genPassword(), id_roles: roles.find(r => r.role_key === 'MANAGER')?.id_roles || '', id_owners: '' })}><i className="fa-solid fa-user-plus" /> {t('New user', 'নতুন ব্যবহারকারী')}</button>}
        </div>
        <div className="table-wrapper"><table>
          <thead><tr><th>{t('User', 'ব্যবহারকারী')}</th><th>{t('Role', 'রোল')}</th><th>{t('Last login', 'সর্বশেষ লগইন')}</th><th>{t('Status', 'অবস্থা')}</th>{editable && <th />}</tr></thead>
          <tbody>
            {!d && <Empty cols={5} text={t('Loading…')} />}
            {d && rows.length === 0 && <Empty cols={5} text={t('No users match.', 'কোনো ব্যবহারকারী নেই।')} />}
            {rows.map((u: any) => (
              <tr key={u.id_users} style={u.is_active ? undefined : { opacity: 0.55 }}>
                <td><div className="fw-semibold">{u.name}{u.id_users === d.me && <span className="badge badge-info" style={{ marginLeft: 6 }}>{t('you', 'আপনি')}</span>}</div><div className="text-xs text-muted">{[u.email, u.phone].filter(Boolean).join(' · ')}</div></td>
                <td><span className={`badge ${u.role_key === 'SUPER_ADMIN' ? 'badge-danger' : u.is_owner_portal ? 'badge-gray' : 'badge-primary'}`}>{bn && roleOf(u.id_roles)?.name_bn ? roleOf(u.id_roles).name_bn : u.role_name || '—'}</span>
                  {u.owner_name && <div className="text-xs text-muted">{t('Owner', 'মালিক')}: {u.owner_name}</div>}</td>
                <td className="text-sm">{u.last_login_at ? dateTime(u.last_login_at) : t('never', 'কখনো না')}</td>
                <td>{u.is_active ? <span className="badge badge-success">{t('Active', 'সক্রিয়')}</span> : <span className="badge badge-gray">{t('Deactivated', 'নিষ্ক্রিয়')}</span>}</td>
                {editable && <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-light btn-sm" aria-label={t('Edit', 'সম্পাদনা')} onClick={() => setForm({ id_users: u.id_users, name: u.name, email: u.email, phone: u.phone || '', id_roles: u.id_roles, id_owners: u.id_owners || '', self: u.id_users === d.me })}><i className="fa-solid fa-pen" /></button>{' '}
                  <button className="btn btn-light btn-sm" title={t('Reset password', 'পাসওয়ার্ড রিসেট')} aria-label={t('Reset password', 'পাসওয়ার্ড রিসেট')} onClick={() => setPw({ id_users: u.id_users, name: u.name, password: genPassword() })}><i className="fa-solid fa-key" /></button>{' '}
                  {u.id_users !== d.me && <button className="btn btn-light btn-sm" title={u.is_active ? t('Deactivate', 'নিষ্ক্রিয়') : t('Activate', 'সক্রিয়')} aria-label={u.is_active ? t('Deactivate', 'নিষ্ক্রিয়') : t('Activate', 'সক্রিয়')} onClick={() => toggle(u)}><i className={u.is_active ? 'fa-solid fa-user-slash' : 'fa-solid fa-user-check'} /></button>}
                </td>}
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {form && (
        <Modal title={form.id_users ? t('Edit user', 'ব্যবহারকারী সম্পাদনা') : t('New user', 'নতুন ব্যবহারকারী')} onClose={() => setForm(null)}
          footer={<><button className="btn btn-light" onClick={() => setForm(null)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" disabled={!form.name || !form.email || !form.id_roles || !!phoneBad || (role?.is_owner_portal && !form.id_owners)} onClick={save}>{t('Save', 'সংরক্ষণ')}</button></>}>
          <div className="form-row cols-2">
            <Field label={t('Full name', 'পূর্ণ নাম')} required><input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} /></Field>
            <Field label={t('Email (login name)', 'ইমেইল (লগইন নাম)')} required><input type="email" className="form-control" value={form.email} onChange={e => set('email', e.target.value)} /></Field>
            <Field label={t('Mobile', 'মোবাইল')} hint={phoneBad ? t('Use 01XXXXXXXXX', '01XXXXXXXXX লিখুন') : undefined}><input className="form-control" inputMode="tel" value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
            <Field label={t('Role', 'রোল')} required hint={form.self ? t('You cannot change your own role', 'নিজের রোল পরিবর্তন করা যায় না') : role?.description}>
              <select className="form-select" disabled={form.self} value={form.id_roles} onChange={e => set('id_roles', Number(e.target.value))}>
                {roles.map(r => <option key={r.id_roles} value={r.id_roles}>{bn && r.name_bn ? r.name_bn : r.name_en}</option>)}</select></Field>
            {role?.is_owner_portal && <Field label={t('Flat owner', 'ফ্ল্যাট মালিক')} required hint={t('The portal shows this owner’s flats and payments', 'পোর্টালে এই মালিকের ফ্ল্যাট ও পেমেন্ট দেখাবে')}>
              <select className="form-select" value={form.id_owners} onChange={e => set('id_owners', Number(e.target.value))}>
                <option value="">{t('— Choose owner —', '— মালিক নির্বাচন —')}</option>{d.owners.map((o: any) => <option key={o.id_owners} value={o.id_owners} disabled={!!o.login_email && o.login_email !== form.email}>{o.full_name}{o.login_email && o.login_email !== form.email ? ` (${t('has a login', 'লগইন আছে')})` : ''}</option>)}</select></Field>}
            {!form.id_users && <Field label={t('Starting password', 'প্রাথমিক পাসওয়ার্ড')} required hint={t('At least 8 characters. Give it to the user privately; they can change it under My account.', 'অন্তত ৮ অক্ষর। ব্যক্তিগতভাবে জানান; তিনি "আমার অ্যাকাউন্ট" থেকে বদলাতে পারবেন।')}>
              <input className="form-control" style={{ fontFamily: 'monospace' }} value={form.password} onChange={e => set('password', e.target.value)} /></Field>}
          </div>
        </Modal>
      )}
      {pw && (
        <Modal title={`${t('Reset password', 'পাসওয়ার্ড রিসেট')} — ${pw.name}`} onClose={() => setPw(null)}
          footer={<><button className="btn btn-light" onClick={() => setPw(null)}>{t('Cancel', 'বাতিল')}</button><button className="btn btn-primary" disabled={pw.password.length < 8} onClick={savePw}>{t('Reset', 'রিসেট')}</button></>}>
          <Field label={t('New password', 'নতুন পাসওয়ার্ড')} hint={t('At least 8 characters. Tell the user privately.', 'অন্তত ৮ অক্ষর। ব্যক্তিগতভাবে জানান।')}><input className="form-control" style={{ fontFamily: 'monospace' }} value={pw.password} onChange={e => setPw({ ...pw, password: e.target.value })} /></Field>
        </Modal>
      )}
    </>
  );
}

// ── Roles & permission matrix ───────────────────────────────────
function RolesTab({ roles, catalog, editable, show, onChanged }: { roles: any[]; catalog: any; editable: boolean; show: Notify; onChanged: () => void }) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const bn = lang === 'bn';
  const [selId, setSelId] = useState<number | null>(roles.find(r => r.role_key === 'MANAGER')?.id_roles || roles[0]?.id_roles || null);
  const [draft, setDraft] = useState<any>(null);
  const sel = draft || roles.find(r => r.id_roles === selId);
  useEffect(() => { setDraft(null); }, [selId]);
  const locked = !sel || sel.is_system || !editable;
  const has = (p: string) => sel?.permissions.includes(p);
  const mine = (p: string) => !!user?.is_super || !!user?.permissions.includes(p); // cannot grant what you lack
  const edit = (fn: (perms: Set<string>) => void) => { const s = new Set<string>(sel.permissions); fn(s); setDraft({ ...sel, permissions: [...s] }); };
  const toggle = (mod: any, action: string, on: boolean) => edit(s => {
    const p = `${mod.key}.${action}`;
    if (on) { s.add(p); s.add(`${mod.key}.view`); }
    else if (action === 'view') { mod.actions.forEach((a: any) => s.delete(a.perm)); }
    else s.delete(p);
  });
  const setGroup = (group: string, level: 'none' | 'view' | 'full') => edit(s => {
    for (const m of catalog.modules.filter((x: any) => x.group === group)) {
      m.actions.forEach((a: any) => s.delete(a.perm));
      if (level !== 'none' && mine(`${m.key}.view`)) s.add(`${m.key}.view`);
      if (level === 'full') m.actions.forEach((a: any) => { if (mine(a.perm)) s.add(a.perm); });
    }
  });
  const save = async () => {
    const r: any = await run(show, api.post('/rbac/roles', { id_roles: sel.id_roles, name_en: sel.name_en, name_bn: sel.name_bn, description: sel.description, permissions: sel.permissions }));
    if (r) { setDraft(null); onChanged(); if (r.id) setSelId(r.id); }
  };
  const create = (copyFrom?: any) => setDraft({ id_roles: undefined, name_en: copyFrom ? `${copyFrom.name_en} (copy)` : '', name_bn: '', description: copyFrom?.description || '',
    permissions: copyFrom ? copyFrom.permissions.filter((p: string) => mine(p)) : [], is_system: false, users: 0 });
  const del = async () => { if (confirm(t(`Delete the role "${sel.name_en}"?`, `"${sel.name_en}" রোল মুছবেন?`)) && await run(show, api.delete(`/rbac/roles/${sel.id_roles}`))) { setSelId(roles[0]?.id_roles); onChanged(); } };
  const grouped = useMemo(() => Object.keys(catalog.groups).map(g => ({ g, mods: catalog.modules.filter((m: any) => m.group === g) })), [catalog]);
  const extraCols = [...new Set<string>(catalog.modules.flatMap((m: any) => m.actions.slice(2).map((a: any) => a.action)))];

  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(220px, 280px) 1fr', alignItems: 'start' }}>
      <div className="card">
        <div className="card-header flex-between"><div className="card-title">{t('Roles', 'রোল')}</div>
          {editable && <button className="btn btn-primary btn-sm" onClick={() => create()}><i className="fa-solid fa-plus" /> {t('New', 'নতুন')}</button>}</div>
        <div style={{ padding: 8 }}>
          {roles.map(r => (
            <button key={r.id_roles} type="button" onClick={() => setSelId(r.id_roles)} aria-pressed={sel?.id_roles === r.id_roles}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 2, background: sel?.id_roles === r.id_roles ? '#eef2ff' : 'transparent' }}>
              <div className="fw-semibold">{bn && r.name_bn ? r.name_bn : r.name_en} {r.is_system && <i className="fa-solid fa-lock text-muted" style={{ fontSize: 11 }} title={t('Built-in', 'বিল্ট-ইন')} />}</div>
              <div className="text-xs text-muted">{r.users} {t('user(s)', 'জন')} · {r.role_key === 'SUPER_ADMIN' ? t('everything', 'সব') : r.is_owner_portal ? t('owner portal', 'মালিক পোর্টাল') : `${r.permissions.length} ${t('permissions', 'অনুমতি')}`}</div>
            </button>
          ))}
        </div>
      </div>

      {sel && <div className="card">
        <div className="card-header" style={{ display: 'block' }}>
          {draft && !locked ? <div className="form-row cols-2">
            <Field label={t('Role name', 'রোলের নাম')} required><input className="form-control" value={sel.name_en} onChange={e => setDraft({ ...sel, name_en: e.target.value })} /></Field>
            <Field label={t('Name in Bangla', 'বাংলা নাম')}><input className="form-control" value={sel.name_bn || ''} onChange={e => setDraft({ ...sel, name_bn: e.target.value })} /></Field>
            <div style={{ gridColumn: '1 / -1' }}><Field label={t('What this role is for', 'রোলের উদ্দেশ্য')}><input className="form-control" value={sel.description || ''} onChange={e => setDraft({ ...sel, description: e.target.value })} /></Field></div>
          </div> : <>
            <div className="card-title">{bn && sel.name_bn ? sel.name_bn : sel.name_en}</div>
            <div className="text-sm text-muted">{sel.description}</div>
          </>}
          <div className="flex gap-2 mt-1" style={{ flexWrap: 'wrap' }}>
            {draft && !locked && <><button className="btn btn-primary btn-sm" disabled={!sel.name_en.trim()} onClick={save}><i className="fa-solid fa-check" /> {t('Save role', 'রোল সংরক্ষণ')}</button>
              <button className="btn btn-light btn-sm" onClick={() => setDraft(null)}>{t('Discard changes', 'বাতিল')}</button></>}
            {!draft && editable && !sel.is_system && <button className="btn btn-light btn-sm" onClick={() => setDraft({ ...sel })}><i className="fa-solid fa-pen" /> {t('Rename', 'নাম পরিবর্তন')}</button>}
            {editable && sel.id_roles && !sel.is_owner_portal && <button className="btn btn-light btn-sm" onClick={() => create(sel)}><i className="fa-solid fa-copy" /> {t('Copy as new role', 'কপি করে নতুন রোল')}</button>}
            {editable && sel.id_roles && !sel.is_system && sel.users === 0 && !draft && <button className="btn btn-light btn-sm" onClick={del}><i className="fa-solid fa-trash" /> {t('Delete', 'মুছুন')}</button>}
          </div>
          {sel.role_key === 'SUPER_ADMIN' && <div className="alert alert-info mt-1">{t('Super admin can do everything and cannot be limited.', 'সুপার অ্যাডমিন সব করতে পারেন; সীমিত করা যায় না।')}</div>}
          {sel.is_owner_portal && <div className="alert alert-info mt-1">{t('Flat owners only see their own portal: flats, payments, complaints, notices, elections and zakat statement.', 'ফ্ল্যাট মালিকরা শুধু নিজের পোর্টাল দেখেন: ফ্ল্যাট, পেমেন্ট, অভিযোগ, নোটিশ, নির্বাচন ও যাকাত বিবরণী।')}</div>}
        </div>
        {!sel.is_owner_portal && <div className="table-wrapper"><table>
          <thead><tr><th>{t('Area', 'এলাকা')}</th><th className="text-center">{t('See', 'দেখা')}</th><th className="text-center">{t('Change', 'পরিবর্তন')}</th>{extraCols.map(c => <th key={c} className="text-center">{c === 'approve' ? t('Approve', 'অনুমোদন') : c === 'settings' ? t('Settings', 'সেটিংস') : c}</th>)}</tr></thead>
          <tbody>
            {grouped.map(({ g, mods }) => (
              <React.Fragment key={g}>
                <tr style={{ background: '#f8fafc' }}><td className="fw-bold">{catalog.groups[g][bn ? 1 : 0]}</td>
                  <td colSpan={2 + extraCols.length}>{!locked && <div className="flex gap-2" style={{ justifyContent: 'center' }}>
                    {(['none', 'view', 'full'] as const).map(l => <button key={l} type="button" className="btn btn-light btn-sm" onClick={() => setGroup(g, l)}>{l === 'none' ? t('None', 'কিছু না') : l === 'view' ? t('See all', 'সব দেখা') : t('Full', 'সম্পূর্ণ')}</button>)}</div>}</td></tr>
                {mods.map((m: any) => (
                  <tr key={m.key}>
                    <td style={{ paddingLeft: 24 }}>{bn ? m.bn : m.en}</td>
                    {['view', 'edit', ...extraCols].map(a => {
                      const act = m.actions.find((x: any) => x.action === a);
                      if (!act) return <td key={a} />;
                      const on = sel.role_key === 'SUPER_ADMIN' || has(act.perm);
                      const blocked = !locked && !on && !mine(act.perm);
                      return <td key={a} className="text-center"><input type="checkbox" aria-label={`${m.en} — ${act.en || a}`} title={blocked ? t('You do not have this permission yourself', 'এই অনুমতি আপনার নিজের নেই') : act.en || ''}
                        checked={on} disabled={locked || blocked} onChange={e => toggle(m, a, e.target.checked)} /></td>;
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table></div>}
        {!locked && draft && <div className="card-footer flex gap-2" style={{ justifyContent: 'flex-end' }}>
          <span className="text-sm text-muted" style={{ marginRight: 'auto' }}>{t('"Change" and special actions include "See".', '"পরিবর্তন" ও বিশেষ অনুমতিতে "দেখা" অন্তর্ভুক্ত।')}</span>
          <button className="btn btn-light" onClick={() => setDraft(null)}>{t('Discard', 'বাতিল')}</button><button className="btn btn-primary" disabled={!sel.name_en.trim()} onClick={save}>{t('Save role', 'রোল সংরক্ষণ')}</button></div>}
      </div>}
    </div>
  );
}
