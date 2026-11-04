import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { TOKEN_KEY } from '../api/client';

interface User { id: number; name: string; email: string; role: string; }
interface AuthCtx { token: string|null; user: User|null; isStaff: boolean; login:(email:string,pass:string)=>Promise<User>; logout:()=>void; }

// admin / manager run the project; 'viewer' logins are flat owners and only see their own portal.
export const STAFF_ROLES = ['admin', 'manager'];

const AuthContext = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string|null>(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User|null>(null);

  useEffect(() => {
    if (token) {
      api.get('/auth/me').then((res:any) => setUser(res.user)).catch(() => logout());
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res:any = await api.post('/auth/login', { email, password });
    if (!res.success) throw new Error(res.message);
    localStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ token, user, isStaff: !!user && STAFF_ROLES.includes(user.role), login, logout }}>{children}</AuthContext.Provider>;
};