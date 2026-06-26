import React from 'react';
import AnimatedNumber from '../AnimatedNumber';
import './dashboard-shared.css';

export default function StatCard({ icon: Icon, iconClass, label, value, sub }) {
  // If the value ends with a '%', we extract the number, animate it, and append the '%'
  const renderValue = () => {
    if (typeof value === 'number') return <AnimatedNumber value={value} duration={600} />;
    if (typeof value === 'string' && value.endsWith('%')) {
      const num = parseInt(value, 10);
      if (!isNaN(num)) return <><AnimatedNumber value={num} duration={600} />%</>;
    }
    return value;
  };

  return (
    <div className="admin-stat-card">
      <div className={`admin-stat-icon ${iconClass || 'blue'}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="admin-stat-label">{label}</div>
        <div className="admin-stat-value">{renderValue()}</div>
        {sub && <div className="admin-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}
