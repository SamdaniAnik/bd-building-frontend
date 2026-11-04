import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

interface User { id: number; name: string; email: string; role: string; }
interface AuthCtx { token: string|null; user: User|null; login:(email:string,pass:string)=>Promise<void>; logout:()=>void; }

const AuthContext = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string|null>(localStorage.getItem('bd_bms_token'));
  const [user, setUser] = useState<User|null>(null);

  useEffect(() => {
    if (token) {
      api.get('/auth/me').then((res:any) => setUser(res.user)).catch(() => logout());
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res:any = await api.post('/auth/login', { email, password });
    if (!res.success) throw new Error(res.message);
    localStorage.setItem('bd_bms_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('bd_bms_token');
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>;
};