import React from 'react';
import './PulseBackground.css';

export default function PulseBackground() {
  return (
    <div className="pulse-bg-container" aria-hidden="true">
      {/* Secondary layer: Gradient Blobs */}
      <div className="pulse-blobs">
        <div className="pulse-blob pb-1" />
        <div className="pulse-blob pb-2" />
        <div className="pulse-blob pb-3" />
      </div>
    </div>
  );
}
