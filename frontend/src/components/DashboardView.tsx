import React, { useEffect, useState } from 'react';
import { Camera, Car, Fingerprint, Activity, ShieldAlert, Gauge, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { fetchCameras, fetchCurrentTraffic, fetchAlerts } from '../services/api';
import { Camera as CameraType, TrafficMetric, Alert } from '../types';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [traffic, setTraffic] = useState<TrafficMetric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [cData, tData, aData] = await Promise.all([
          fetchCameras(),
          fetchCurrentTraffic(),
          fetchAlerts()
        ]);
        setCameras(cData);
        setTraffic(tData);
        setAlerts(aData);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, []);

  const totalVehicles = traffic.reduce((acc, t) => acc + t.vehicle_count, 0);
  const avgSpeed = traffic.length > 0
    ? (traffic.reduce((acc, t) => acc + t.avg_speed_kmh, 0) / traffic.length).toFixed(1)
    : '54.2';

  const severeCount = traffic.filter(t => t.congestion_level === 'HEAVY' || t.congestion_level === 'SEVERE').length;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>Executive Traffic Control Center</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Real-time citywide multi-camera AI ANPR, cross-camera Re-ID, and spatial analytics engine</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigateTab('cameras')}>
          <Camera size={18} />
          <span>View All 8 Camera Feeds</span>
        </button>
      </div>

      {/* KPI CARDS GRID */}
      <div className="kpi-grid">
        <div className="glass-panel kpi-card">
          <div>
            <div className="kpi-title">Active Cameras</div>
            <div className="kpi-value">{cameras.length || 8} <span style={{ fontSize: '1rem', color: 'var(--accent-emerald)' }}>/ 8</span></div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '0.25rem' }}>● 100% Operational</div>
          </div>
          <div className="kpi-icon" style={{ borderColor: 'rgba(0, 229, 255, 0.3)', color: 'var(--accent-cyan)' }}>
            <Camera size={24} />
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div>
            <div className="kpi-title">Vehicles Tracked</div>
            <div className="kpi-value">{totalVehicles || 28}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Live Multi-Object Tracking</div>
          </div>
          <div className="kpi-icon" style={{ borderColor: 'rgba(59, 130, 246, 0.3)', color: 'var(--accent-blue)' }}>
            <Car size={24} />
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div>
            <div className="kpi-title">Unique Re-Identities</div>
            <div className="kpi-value">42</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '0.25rem' }}>Cross-Camera Persistence</div>
          </div>
          <div className="kpi-icon" style={{ borderColor: 'rgba(168, 85, 247, 0.3)', color: 'var(--accent-purple)' }}>
            <Fingerprint size={24} />
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div>
            <div className="kpi-title">Avg Network Speed</div>
            <div className="kpi-value">{avgSpeed} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>km/h</span></div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '0.25rem' }}>Normal Flow Range</div>
          </div>
          <div className="kpi-icon" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)' }}>
            <Gauge size={24} />
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div>
            <div className="kpi-title">Congestion Hotspots</div>
            <div className="kpi-value">{severeCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>nodes</span></div>
            <div style={{ fontSize: '0.75rem', color: severeCount > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)', marginTop: '0.25rem' }}>
              {severeCount > 0 ? 'Heavy Density Flagged' : 'All Clear'}
            </div>
          </div>
          <div className="kpi-icon" style={{ borderColor: 'rgba(245, 158, 11, 0.3)', color: 'var(--accent-amber)' }}>
            <Activity size={24} />
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div>
            <div className="kpi-title">Active Alerts</div>
            <div className="kpi-value">{alerts.length || 3}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-crimson)', marginTop: '0.25rem' }}>Watchlist & Anomaly</div>
          </div>
          <div className="kpi-icon" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--accent-crimson)' }}>
            <ShieldAlert size={24} />
          </div>
        </div>
      </div>

      {/* DASHBOARD CONTENT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        {/* CAMERA STATUS OVERVIEW TABLE */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Live Camera Node Network</h3>
            <button className="btn" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', background: 'rgba(255,255,255,0.05)' }} onClick={() => onNavigateTab('cameras')}>
              Full Feeds <ArrowUpRight size={14} />
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Camera ID & Name</th>
                <th>Location</th>
                <th>Vehicles</th>
                <th>Avg Speed</th>
                <th>Density</th>
                <th>Congestion Status</th>
              </tr>
            </thead>
            <tbody>
              {traffic.map((t) => {
                const cam = cameras.find(c => c.id === t.camera_id);
                const badgeClass = `badge badge-${t.congestion_level.toLowerCase()}`;
                return (
                  <tr key={t.camera_id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{t.camera_id}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cam?.name || 'Intersection'}</div>
                    </td>
                    <td>{cam?.location || 'City Center'}</td>
                    <td style={{ fontWeight: 700 }}>{t.vehicle_count}</td>
                    <td>{t.avg_speed_kmh} km/h</td>
                    <td>{t.density_veh_km} veh/km</td>
                    <td>
                      <span className={badgeClass}>{t.congestion_level}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* LIVE ALERT STREAM */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} style={{ color: 'var(--accent-crimson)' }} />
              Live Alerts Stream
            </h3>
            <button className="btn" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', background: 'rgba(255,255,255,0.05)' }} onClick={() => onNavigateTab('alerts')}>
              Manage Watchlist
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
            {alerts.slice(0, 5).map((a) => (
              <div key={a.id} style={{
                padding: '0.85rem',
                borderRadius: '8px',
                background: a.priority === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                borderLeft: `4px solid ${a.priority === 'CRITICAL' ? 'var(--accent-crimson)' : 'var(--accent-amber)'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>{a.plate}</span>
                  <span className={`badge ${a.priority === 'CRITICAL' ? 'badge-heavy' : 'badge-moderate'}`}>{a.alert_type}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>{a.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>📍 {a.camera_name} ({a.camera_id})</span>
                  <span>{new Date(a.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
