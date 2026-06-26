import React from 'react';
import './LoadingSkeleton.css';

export default function LoadingSkeleton({ type = 'card', count = 1, style = {} }) {
  const skeletons = Array(count).fill(0);

  if (type === 'card') {
    return (
      <div className="skeleton-container" style={style}>
        {skeletons.map((_, i) => (
          <div key={i} className="glass-panel skeleton-card">
            <div className="skeleton-header">
              <div className="skeleton-avatar" />
              <div className="skeleton-lines">
                <div className="skeleton-line w-40" />
                <div className="skeleton-line w-20" />
              </div>
            </div>
            <div className="skeleton-line w-100" />
            <div className="skeleton-line w-80" />
            <div className="skeleton-line w-60" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="glass-panel skeleton-table" style={style}>
        {skeletons.map((_, i) => (
          <div key={i} className="skeleton-table-row">
            <div className="skeleton-avatar small" />
            <div className="skeleton-line w-30" />
            <div className="skeleton-line w-20" />
            <div className="skeleton-line w-20" />
          </div>
        ))}
      </div>
    );
  }

  // default block
  return (
    <div className="skeleton-container" style={style}>
      {skeletons.map((_, i) => (
        <div key={i} className="skeleton-block" />
      ))}
    </div>
  );
}
