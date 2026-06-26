import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, BarChart3,
  Bot, Camera, User, LogOut, Activity, Shield, Settings,
  CheckSquare, MessageSquare, TrendingUp, Users, Tags, Building2, CreditCard, Calendar, Target, HardDrive,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import Logo from './Logo';

const ALL_LINKS = [
  // Org / Admin level
  { to: '/admin', icon: LayoutDashboard, label: 'Org Dashboard', requiredPermission: 'VIEW_ORG_DATA' },
  { to: '/admin/users', icon: Users, label: 'Users', requiredPermission: 'MANAGE_USERS' },
  { to: '/admin/roles', icon: Shield, label: 'Roles & Permissions', requiredPermission: 'MANAGE_ROLES' },
  { to: '/admin/audit-logs', icon: HardDrive, label: 'Audit Logs', requiredPermission: 'MANAGE_SYSTEM_SETTINGS' },
  { to: '/admin/categories', icon: Tags, label: 'App Categories', requiredPermission: 'MANAGE_APP_CATEGORIES' },
  { to: '/admin/organization', icon: Building2, label: 'Organization', requiredPermission: 'MANAGE_SETTINGS' },
  { to: '/admin/billing', icon: CreditCard, label: 'Billing & Policies', requiredPermission: 'MANAGE_SETTINGS' },
  
  // Team / Manager level
  { to: '/manager', icon: LayoutDashboard, label: 'Team Overview', requiredPermission: 'VIEW_TEAM_DATA' },
  { to: '/manager/activity', icon: Activity, label: 'Team Activity', requiredPermission: 'VIEW_TEAM_DATA' },
  { to: '/performance', icon: TrendingUp, label: 'Performance', requiredPermission: 'VIEW_TEAM_ANALYTICS' },
  { to: '/messages', icon: MessageSquare, label: 'Messages', badge: 'messages', requiredPermission: 'VIEW_TEAM_DATA' }, // Could use a specific permission
  
  // Employee level
  { to: '/employee', icon: LayoutDashboard, label: 'My Dashboard', requiredPermission: 'VIEW_OWN_DATA', hideIfHas: 'VIEW_TEAM_DATA' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks', requiredPermission: 'VIEW_OWN_DATA' },
  { to: '/goals', icon: Target, label: 'Goals & OKRs', requiredPermission: 'VIEW_OWN_DATA' },
  { to: '/leaves', icon: Calendar, label: 'Leaves', requiredPermission: 'REQUEST_LEAVES' },
  { to: '/employee/activity', icon: Activity, label: 'My Activity', requiredPermission: 'VIEW_OWN_DATA', hideIfHas: 'VIEW_TEAM_DATA' },
  
  // Shared
  { to: '/settings', icon: Settings, label: 'Account Settings', requiredPermission: null }, // Everyone
];

export default function Sidebar({ className = '', onClose }) {
  const { user, logout, effectivePermissions } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const hasPerm = (p) => {
    if (!p) return true;
    if (user?.role === 'admin') return true; // Fallback during migration
    return effectivePermissions?.includes(p);
  };

  const links = ALL_LINKS.filter(link => {
    if (!hasPerm(link.requiredPermission)) return false;
    if (link.hideIfHas && hasPerm(link.hideIfHas)) return false;
    return true;
  });
  
  // Minimal mock for unread count, ideally from SocketContext or messages API
  const unreadMessages = 0;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`sidebar ${className} ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header / Logo */}
      <Link to="/" style={{ textDecoration: 'none' }}>
        <div className="sidebar-header" style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '24px 0' : '24px' }}>
          <Logo size={32} />
          {!isCollapsed && <div className="sidebar-logo">Work<span style={{ color: 'var(--accent-primary)' }}>Pulse</span></div>}
        </div>
      </Link>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {links.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            end={to === '/manager' || to === '/employee' || to === '/admin'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={isCollapsed ? label : undefined}
          >
            <Icon size={18} />
            {!isCollapsed && <span style={{ flex: 1 }}>{label}</span>}
            {!isCollapsed && badge === 'messages' && unreadMessages > 0 && (
              <span className="badge badge-danger" style={{ padding: '2px 6px', fontSize: 11, borderRadius: 10 }}>
                {unreadMessages}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / User */}
      <div className="sidebar-footer">
        <div className="user-profile" style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
          <div className="user-avatar" title={isCollapsed ? user?.name : undefined}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {user?.role?.toUpperCase()}
              </div>
            </div>
          )}
          {!isCollapsed && (
            <button className="btn btn-ghost" style={{ padding: 8, color: 'var(--danger, #EF4444)' }} onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
