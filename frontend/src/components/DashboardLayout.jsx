import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import HeaderActions from './HeaderActions';
import TopBar from './TopBar';
import Logo from './Logo';
import PulseAIPanel from './PulseAIPanel';
import { Sparkles } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Keyboard shortcut Ctrl+/ or Ctrl+K to toggle Pulse AI Panel
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '/' || e.key === 'k')) {
        e.preventDefault();
        setIsAIPanelOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      <div className="main-content" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>

      {/* Pulse AI Panel */}
      <PulseAIPanel isOpen={isAIPanelOpen} onClose={() => setIsAIPanelOpen(false)} />

      {/* Floating Action Button */}
      <button
        onClick={() => setIsAIPanelOpen(prev => !prev)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--brand-primary)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 1000,
          transition: '0.2s',
        }}
        title="Ask Pulse AI (Ctrl+K)"
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Sparkles size={24} />
      </button>
    </div>
  );
}
