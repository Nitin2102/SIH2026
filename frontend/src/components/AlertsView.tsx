import React, { useEffect, useState } from 'react';
import { ShieldAlert, Plus, Trash2, CheckCircle, AlertTriangle, Radio } from 'lucide-react';
import { fetchAlerts, fetchWatchlist, addToWatchlist, deleteFromWatchlist } from '../services/api';
import { Alert, WatchlistItem } from '../types';

export const AlertsView: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [watchlist, setWatchlist] = useState<Record<string, WatchlistItem>>({});
  const [newPlate, setNewPlate] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newPriority, setNewPriority] = useState<string>('HIGH');
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [aData, wData] = await Promise.all([fetchAlerts(), fetchWatchlist()]);
      setAlerts(aData);
      setWatchlist(wData);
    } catch (err) {
      console.error("Alerts load error:", err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Setup WebSocket live alert listener
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket('ws://localhost:8000/ws/alerts');
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'ALERT') {
          setAlerts(prev => [msg.data, ...prev]);
        }
      };
    } catch (e) {
      setWsConnected(false);
    }
    return () => {
      ws?.close();
    };
  }, []);

  const handleAddWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate || !newDesc) return;
    await addToWatchlist(newPlate, newDesc, newPriority);
    setNewPlate('');
    setNewDesc('');
    loadData();
  };

  const handleDeleteWatchlist = async (plate: string) => {
    await deleteFromWatchlist(plate);
    loadData();
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>Blacklist & Real-Time Alert Manager</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configure target watchlist plates and monitor real-time automated alerts pushed via WebSockets</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Radio size={16} style={{ color: wsConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)' }} />
          <span style={{ fontSize: '0.85rem', color: wsConnected ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
            {wsConnected ? 'WebSocket Channel Live' : 'Polling Sync Mode'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.5rem' }}>
        {/* WATCHLIST MANAGER */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} style={{ color: 'var(--accent-cyan)' }} />
            Add Target to Watchlist
          </h3>

          <form onSubmit={handleAddWatchlist} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Target License Plate</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. KA01AB1234"
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Alert Reason / Description</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. High Interest Vehicle / Stolen Report"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Priority Level</label>
              <select
                className="input-field"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              <Plus size={16} /> Add Watchlist Target
            </button>
          </form>

          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
            Active Watchlist Database ({Object.keys(watchlist).length})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
            {Object.entries(watchlist).map(([plate, item]) => (
              <div key={plate} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>{plate}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.description}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`badge ${item.priority === 'CRITICAL' ? 'badge-heavy' : 'badge-moderate'}`}>
                    {item.priority}
                  </span>
                  <button
                    onClick={() => handleDeleteWatchlist(plate)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-crimson)', cursor: 'pointer', padding: '0.2rem' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACTIVE ALERTS HISTORY */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} style={{ color: 'var(--accent-crimson)' }} />
            Active Real-Time Alert Log ({alerts.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '560px', overflowY: 'auto' }}>
            {alerts.map((a) => (
              <div key={a.id} style={{
                padding: '1rem',
                borderRadius: '8px',
                background: a.priority === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                borderLeft: `4px solid ${a.priority === 'CRITICAL' ? 'var(--accent-crimson)' : 'var(--accent-amber)'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{a.plate}</span>
                    <span className="badge badge-heavy">{a.alert_type}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(a.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {a.description}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>📍 Camera: <strong>{a.camera_name} ({a.camera_id})</strong></span>
                  <span>Vehicle Class: <strong style={{ textTransform: 'capitalize' }}>{a.vehicle_class}</strong></span>
                  <span>Confidence: <strong>{(a.confidence * 100).toFixed(0)}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
