import React, { useState, useEffect } from 'react';
import { Camera, Map, Search, BarChart3, ShieldAlert, LayoutDashboard, Radio } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  alertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, alertCount }) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString());
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cameras', label: 'Live Cameras', icon: Camera },
    { id: 'map', label: 'GIS City Map', icon: Map },
    { id: 'search', label: 'Vehicle Search', icon: Search },
    { id: 'analytics', label: 'Traffic Analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Alert Center', icon: ShieldAlert, badge: alertCount },
  ];

  return (
    <header className="navbar">
      <div className="brand">
        <Radio className="text-cyan-400 animate-pulse" size={26} style={{ color: 'var(--accent-cyan)' }} />
        <span>METRO<span className="brand-badge">SIGHT</span></span>
      </div>

      <nav className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-btn ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="badge badge-heavy" style={{ marginLeft: '4px' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span className="pulse-dot"></span>
          <span>SYSTEM LIVE</span>
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--accent-cyan)' }}>
          {time}
        </div>
      </div>
    </header>
  );
};
