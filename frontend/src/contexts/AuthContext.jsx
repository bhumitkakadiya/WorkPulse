import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('wp_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intercept requests to attach token dynamically
    const reqInterceptor = axios.interceptors.request.use(
      (config) => {
        const storedToken = localStorage.getItem('wp_token');
        if (storedToken) config.headers.Authorization = `Bearer ${storedToken}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Intercept 401s globally
    const resInterceptor = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401 && !err.config?.url?.includes('/api/auth/login')) {
          logout();
        }
        return Promise.reject(err);
      }
    );

    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [token]);

  const [effectivePermissions, setEffectivePermissions] = useState([]);

  const fetchMe = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data.user);
      setEffectivePermissions(res.data.effectivePermissions || []);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token: t, user: u } = res.data;
    localStorage.setItem('wp_token', t);
    axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    setToken(t);
    setUser(u);
    // Always fetch /me to get full user + effectivePermissions (avoids race condition)
    try {
      const meRes = await axios.get('/api/auth/me');
      setUser(meRes.data.user);
      setEffectivePermissions(meRes.data.effectivePermissions || []);
    } catch {}
    return u;
  };

  const register = async (payload) => {
    const res = await axios.post('/api/auth/register', payload);
    const { token: t, user: u } = res.data;
    if (t) {
      localStorage.setItem('wp_token', t);
      axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
      setToken(t);
      setUser(u);
    }
    return u;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('wp_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setEffectivePermissions([]);
  }, []);

  const updatePreferences = async (prefs) => {
    await axios.put('/api/auth/preferences', prefs);
    setUser(prev => ({ ...prev, preferences: { ...prev.preferences, ...prefs } }));
  };

  const value = useMemo(() => ({
    user, token, loading, login, register, logout, updatePreferences, effectivePermissions
  }), [user, token, loading, effectivePermissions, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
