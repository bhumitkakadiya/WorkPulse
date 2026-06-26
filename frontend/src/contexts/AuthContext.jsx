import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('wp_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intercept 401s globally
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          logout();
        }
        return Promise.reject(err);
      }
    );

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchMe();
    } else {
      setLoading(false);
    }

    return () => axios.interceptors.response.eject(interceptor);
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
    const { token: t, user: u, effectivePermissions: ep } = res.data;
    localStorage.setItem('wp_token', t);
    axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    setToken(t);
    setUser(u);
    if (ep) setEffectivePermissions(ep);
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

  const logout = () => {
    localStorage.removeItem('wp_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const updatePreferences = async (prefs) => {
    await axios.put('/api/auth/preferences', prefs);
    setUser(prev => ({ ...prev, preferences: { ...prev.preferences, ...prefs } }));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updatePreferences, effectivePermissions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
