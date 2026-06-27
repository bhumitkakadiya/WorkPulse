import React from 'react';
import './SkeletonLoader.css';

export default function SkeletonLoader({ type = 'text', count = 1, style = {} }) {
  const skeletons = Array(count).fill(0);

  const getSkeletonContent = () => {
    switch (type) {
      case 'card':
        return (
          <div className="skeleton-card glass-panel" style={style}>
            <div className="skeleton-header">
              <div className="skeleton-avatar" />
              <div className="skeleton-lines">
                <div className="skeleton-line" style={{ width: '40%' }} />
                <div className="skeleton-line" style={{ width: '20%' }} />
              </div>
            </div>
            <div className="skeleton-line" style={{ width: '100%', marginTop: '16px' }} />
            <div className="skeleton-line" style={{ width: '80%' }} />
            <div className="skeleton-line" style={{ width: '60%' }} />
          </div>
        );
      case 'table-row':
        return (
          <div className="skeleton-table-row" style={style}>
            <div className="skeleton-avatar" style={{ width: '32px', height: '32px' }} />
            <div className="skeleton-line" style={{ width: '30%' }} />
            <div className="skeleton-line" style={{ width: '20%' }} />
            <div className="skeleton-line" style={{ width: '20%' }} />
          </div>
        );
      case 'chart':
        return (
          <div className="skeleton-chart" style={style}>
            <div className="skeleton-chart-bar" style={{ height: '40%' }} />
            <div className="skeleton-chart-bar" style={{ height: '70%' }} />
            <div className="skeleton-chart-bar" style={{ height: '50%' }} />
            <div className="skeleton-chart-bar" style={{ height: '90%' }} />
            <div className="skeleton-chart-bar" style={{ height: '30%' }} />
            <div className="skeleton-chart-bar" style={{ height: '80%' }} />
          </div>
        );
      case 'stat':
        return (
          <div className="skeleton-stat glass-panel" style={style}>
            <div className="skeleton-line" style={{ width: '40%', height: '14px' }} />
            <div className="skeleton-line" style={{ width: '60%', height: '28px', marginTop: '12px' }} />
            <div className="skeleton-line" style={{ width: '30%', height: '12px', marginTop: '8px' }} />
          </div>
        );
      case 'text':
      default:
        return <div className="skeleton-line" style={{ width: '100%', ...style }} />;
    }
  };

  return (
    <div className={`skeleton-wrapper skeleton-${type}`}>
      {skeletons.map((_, index) => (
        <React.Fragment key={index}>
          {getSkeletonContent()}
        </React.Fragment>
      ))}
    </div>
  );
}
