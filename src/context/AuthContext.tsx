import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { TOKEN_KEY } from '../api/client';

// The server sends the user's role, permissions ("inventory.edit", "transfers.approve"…) and which module each
// page belongs to (bd-building-management/utils/permissions.js). The menu and route guard use these; the API
// enforces the same rules, so hiding something here is a convenience, not the protection.
export interface User {
  id: number; name: string; email: string; role: string; role_key: string; role_name: string;
  is_super: boolean; is_owner_portal: boolean; permissions: string[]; pages: { path: string; module: string }[];
}
interface AuthCtx {
  token: string | null; user: User | null; isStaff: boolean;
  can: (perm: string) => boolean;                 // e.g. can('inventory.edit')
  canPage: (path: string) => boolean;             // may this user open the page at `path`?
  firstPage: () => string;                        // where to land after login
  login: (email: string, pass: string) => Promise<User>; logout: () => void; refresh: () => void;
}

// Legacy: admin / manager are staff; 'viewer' logins are flat owners.
export const STAFF_ROLES = ['admin', 'manager'];

const AuthContext = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(AuthContext);

// Pages any staff login may open (no module of their own).
const OPEN_STAFF_PAGES = ['/account'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);

  const logout = () => { localStorage.removeItem(TOKEN_KEY); setToken(null); setUser(null); };
  const refresh = useCallback(() => { if (token) api.get('/auth/me').then((res: any) => setUser(res.user)).catch(() => logout()); }, [token]);
  useEffect(() => { refresh(); }, [refresh]);
  // Pick up role changes made by an administrator without a re-login.
  useEffect(() => {
    if (!token) return;
    const h = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, [token, refresh]);

  const login = async (email: string, password: string) => {
    const res: any = await api.post('/auth/login', { email, password });
    if (!res.success) throw new Error(res.message);
    localStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const can = (perm: string) => !!user && (user.is_super || user.permissions.includes(perm));
  const canPage = (path: string) => {
    if (!user) return false;
    if (user.is_owner_portal) return path.startsWith('/apartment/owner-portal') || path.startsWith('/print/receipt');
    if (user.is_super || OPEN_STAFF_PAGES.some(p => path.startsWith(p)) || path.startsWith('/print/receipt')) return true;
    // Longest matching page prefix decides the module.
    const match = user.pages.filter(p => path === p.path || path.startsWith(p.path + '/')).sort((a, b) => b.path.length - a.path.length)[0];
    if (!match) return path.startsWith('/apartment/owner-portal') ? can('owners.view') : false;
    return can(`${match.module}.view`);
  };
  const firstPage = () => {
    if (!user) return '/login';
    if (user.is_owner_portal) return '/apartment/owner-portal';
    if (canPage('/apartment/dashboard')) return '/apartment/dashboard';
    return user.pages.find(p => !p.path.startsWith('/print') && canPage(p.path))?.path || '/account';
  };

  return <AuthContext.Provider value={{ token, user, isStaff: !!user && !user.is_owner_portal, can, canPage, firstPage, login, logout, refresh }}>{children}</AuthContext.Provider>;
};
