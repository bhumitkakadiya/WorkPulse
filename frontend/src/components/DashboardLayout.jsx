import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import HeaderActions from './HeaderActions';
import Logo from './Logo';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="app-container">
      {/* Mobile Topbar */}
      <div className="mobile-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className="btn btn-icon btn-ghost" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            <Logo size={28} />
            <div className="sidebar-logo" style={{ fontSize: '20px' }}>Work<span style={{ color: 'var(--accent-primary)' }}>Pulse</span></div>
          </div>
        <div style={{ flex: 1 }} />
      </div>

      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={closeSidebar} 
      />

      {/* Sidebar - modified to accept open state */}
      <Sidebar className={isSidebarOpen ? 'open' : ''} onClose={closeSidebar} />

      {/* Main Content Area */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}
