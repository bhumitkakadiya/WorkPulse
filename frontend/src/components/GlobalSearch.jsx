import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, User, Settings, LayoutDashboard, Command, X } from 'lucide-react';
import axios from 'axios';
import './GlobalSearch.css';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ routes: [], users: [] });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  useEffect(() => {
    const q = query.toLowerCase();
    const staticRoutes = [
      { label: 'Settings', path: '/settings', icon: Settings },
      { label: 'My Activity', path: '/employee', icon: User },
    ];
    if (user?.role === 'admin' || user?.role === 'manager') {
      staticRoutes.push({ label: 'Team Overview', path: '/manager', icon: LayoutDashboard });
    }
    
    const matchedRoutes = staticRoutes.filter(r => r.label.toLowerCase().includes(q));

    if (!q) {
      setSearchResults({ routes: matchedRoutes, users: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`/api/users/search?q=${q}`);
        setSearchResults({ routes: matchedRoutes, users: res.data.users || [] });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [query, user]);

  const handleSelect = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="search-backdrop" onClick={() => setIsOpen(false)}>
      <div className="search-modal card-3d" onClick={e => e.stopPropagation()}>
        <div className="search-header">
          <Search size={18} color="var(--text-muted)" />
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search pages or employees..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setIsOpen(false)}>
            <X size={16} />
          </button>
        </div>
        <div className="search-body">
          {searchResults.routes.length > 0 || searchResults.users.length > 0 ? (
            <div className="search-results">
              {searchResults.routes.length > 0 && (
                <>
                  <div className="search-group-title">Navigation</div>
                  {searchResults.routes.map((r, i) => (
                    <button key={`route-${i}`} className="search-result-item" onClick={() => handleSelect(r.path)}>
                      <r.icon size={16} /> {r.label}
                    </button>
                  ))}
                </>
              )}

              {searchResults.users.length > 0 && (
                <>
                  <div className="search-group-title" style={{ marginTop: '16px' }}>Colleagues</div>
                  {searchResults.users.map((u) => (
                    <button key={`user-${u.userId}`} className="search-result-item" onClick={() => handleSelect(`/profile/${u.userId}`)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff', fontWeight: 600 }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{u.name} <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 400 }}>@{u.userId}</span></span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.jobTitle || u.department}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="search-empty">
              {loading ? 'Searching...' : `No results found for "${query}"`}
            </div>
          )}
        </div>
        <div className="search-footer">
          <span className="search-shortcut"><Command size={12} /> K</span> to search, <span className="search-shortcut">ESC</span> to close
        </div>
      </div>
    </div>
  );
}
