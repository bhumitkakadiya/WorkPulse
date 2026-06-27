import React, { useState, useEffect } from 'react';
import { Search, Moon, Sun, Bell, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import './TopBar.css';

const TopBar = () => {
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark' || 
    !document.documentElement.hasAttribute('data-theme') // Default to dark based on old root
  );
  
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="topbar">
      <div className="topbar-search-container">
        <div className={`topbar-search ${isSearchFocused ? 'focused' : ''}`}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search employees, alerts, tasks..."
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </div>
      </div>

      <div className="topbar-actions">
        <button className="topbar-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="topbar-dropdown-container">
          <button 
            className="topbar-btn" 
            onClick={() => { setShowNotifications(!showNotifications); setShowMessages(false); }}
          >
            <Bell size={20} />
            <span className="notification-dot"></span>
          </button>
          
          {showNotifications && (
            <div className="topbar-dropdown animate-scale-in">
              <div className="dropdown-header">
                <h4>Notifications</h4>
                <button className="text-link">Mark all read</button>
              </div>
              <div className="dropdown-body">
                <div className="dropdown-empty">No new notifications</div>
              </div>
              <div className="dropdown-footer">
                <Link to="/admin">View all</Link>
              </div>
            </div>
          )}
        </div>

        <div className="topbar-dropdown-container">
          <button 
            className="topbar-btn"
            onClick={() => { setShowMessages(!showMessages); setShowNotifications(false); }}
          >
            <MessageSquare size={20} />
          </button>
          
          {showMessages && (
            <div className="topbar-dropdown animate-scale-in">
              <div className="dropdown-header">
                <h4>Messages</h4>
              </div>
              <div className="dropdown-body">
                <div className="dropdown-empty">No recent messages</div>
              </div>
              <div className="dropdown-footer">
                <Link to="/messages">Go to Messages</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
