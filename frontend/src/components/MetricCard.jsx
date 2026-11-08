import React from 'react';

export default function MetricCard({ title, value, icon, color = '#1d4ed8', bg = '#eff6ff', subtitle }) {
  return (
    <div className="metric-card">
      <div className="metric-icon-wrap" style={{ backgroundColor: bg, color }}>
        {icon}
      </div>
      <div>
        <div className="metric-value">{value}</div>
        <div className="metric-label">{title}</div>
        {subtitle && (
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
